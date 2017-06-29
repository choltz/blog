+++
title         = "Service object test strategies"
date          = "2016-05-11T17:00:00"
comments      = true
thumbnail     = "images/chess.png"
image_creator = "https://www.flickr.com/photos/edith_soto/"
+++
Previously,  we looked at service objects: what are they, how can they clean up controllers and models, and how they can better organize your Rails project. Next we'll see how service objects simplify unit tests and can speed up your test suite.
<!--more-->

This is a multi-part series:

* <a href="/blog/organize-your-app-with-service-objects">Part I: Organize your app with service objects</a>
* <a href="/blog/service-object-test-strategies">Part II: Service Object Test Strategies</a>

## Starting Point
Let's begin with something similar to <a href="/blog/organize-your-app-with-service-objects">Part I</a>. When an administrator creates a new user account, other admins will receive either an email or an SMS notification. All of the logic is inside of the `User` model.

```
# app/models/user.rb
class User < ActiveRecord::Base
  messageable_user = -> (field, exclude){
    relation = where("#{field} is not null")
    relation = relation.where("#{field} <> ?", exclude[field]) if exclude.present?
    relation
  }

  scope :emailable_users, messageable_user.curry.call('email_address')
  scope :textable_users,  messageable_user.curry.call('phone_number')

  after_create :notify_users

  private

  def notify_users
    User.emailable_users(self).each do |recipient|
      UserMailer.notify_users(recipient: recipient, new_user: self).deliver_now
    end

    User.textable_users(self).each do |recipient|
      send_text recipient: recipient, new_user: self
    end
  end

  def send_text(recipient: , new_user: )
    # This is a call to a fictional SMS service
    TextMessageApi.send_message recipient.phone_number, "A new user has been created: #{new_user.email_address}"
  end
end
```

The scopes may look odd to you, but don't be concerned - if you are unfamiliar with the <a href="http://ruby-doc.org/core-2.3.0/Method.html#method-i-curry" target = "window">curry</a> method, it translates a function that takes multiple arguments into a sequence of of functions, each with a single argument. For example:

```
add      = -> (first, second) { first + second }
function = add.curry
results1 = function.call(1, 2)
results2 = function.call(1).call(2)
results1 == results2
=> true
```
This contrived example has limited usefulness, but you can see in the `User` model that `curry` is used to apply the same lambda function to multiple scopes.

## First Draft Tests
As discussed in <a href="/blog/organize-your-app-with-service-objects">Part I</a>, there are problems with this code. Multiple concerns are combined into one location - this impacts the corresponding unit tests. All of the associated test logic is in `test/unit/user_test.rb`.


```
require_relative '../test_helper'

class UserTest < ActiveSupport::TestCase
  setup do
    (1..3).each{ |n| FactoryGirl.create :user, email_address: "test#{n}@test.com" }
    (1..5).each{ |n| FactoryGirl.create :user, phone_number:   "#{n}#{n}#{n}-#{n}#{n}#{n}#{n}" }
  end

  context 'scopes' do
    should 'return all users that receive email notifications' do
      assert_equal 3, User.emailable_users(nil).length
    end

    should 'return all users that receive sms notifications' do
      assert_equal 5, User.textable_users(nil).length
    end
  end

  context 'notifications' do
    should 'send email notifications on user create' do
      ActionMailer::Base.deliveries = []
      FactoryGirl.create :user, email_address: "test@test.com"

      assert_equal 3, ActionMailer::Base.deliveries.length
    end

    should 'send sms notifications on user create' do
      TextMessageApi.deliveries = []
      FactoryGirl.create :user, phone_number: "999-9999"

      assert_equal 5, TextMessageApi.deliveries.length
    end
  end
end
```

<span style="color: #aaa; font-size: .9em;">All test examples are built with minitest and use the <a style="color: #aaa;" href="https://github.com/thoughtbot/shoulda-context" target="window">shoulda-context</a> gem. However, the principals apply equally well to other unit test frameworks.</span>

Like the original code this file tests, there are several problems:

0. Callbacks force us to test side-effects of operations rather than isolating tests to specific behavior
0. Potentially complex data setup is required to test messaging
0. Single-responsibility tests are hard to write

Having just written these unit tests, I can say first-hand that this was a pain in the neck - with special emphasis on indirectly testing message counts based on callbacks generated on the creation of a new user.

By splitting the user logic into individual services, the unit tests become much more direct - tests focus on the behavior of the service object instead of tangentially related data.

## Second Draft
Let's rearrange the `User` model code into a few services: `SendSmsMessage`, `NotifyUsers`, and `CreateUser`.


### User Model
```
# app/models/user.rb
class User < ActiveRecord::Base
  messageable_user = -> (field, exclude){
    relation = where("#{field} is not null")
    relation = relation.where("#{field} <> ?", exclude[field]) if exclude.present?
    relation
  }.curry

  scope :emailable_users, messageable_user.call('email_address')
  scope :textable_users,  messageable_user.call('phone_number')
end
```

The trimmed-down user model is much cleaner - the logic is concerned only with user data. Note: the curry call was moved to the end of the lambda declaration - no need to call it  every time we define a scope.

```
# test/models/user_test.rb
require_relative '../test_helper'

class UserTest < ActiveSupport::TestCase
  setup do
    (1..3).each{ |n| FactoryGirl.create :user, email_address: "test#{n}@test.com" }
    (1..5).each{ |n| FactoryGirl.create :user, phone_number:   "#{n}#{n}#{n}-#{n}#{n}#{n}#{n}" }
  end

  context 'scopes' do
    should 'return all users that receive email notifications' do
      assert_equal 3, User.emailable_users(exclude = nil).length
    end

    should 'return all users that receive sms notifications' do
      assert_equal 5, User.textable_users(exclude = nil).length
    end
  end
end
```

The tests are also simplified. With the callback removed, the tests aren't concerned with notification counts that are dependent on the creation of new user records.

### Send SMS Message Service

```
# app/services/send_sms_message.rb
module Services
  class SendSmsMessage
    include Services::Base

    def call(phone_number, message)
      TextMessageApi.send_message phone_number, message
    end
  end
end
```

The `SendSmsMessage` service really doesn't do much - it is a glorified wrapper around the text message API. Though it doesn't seem like much of a win, the service centralizes all SMS activity which makes it much easier to change SMS providers that may contain differing APIs.

```
# test/services/send_sms_message_test.rb
require_relative '../test_helper'

class SendSmsTextTest < ActiveSupport::TestCase
  setup do
    TextMessageApi.deliveries = []
  end

  should 'send a message to the specified phone number' do
    Services::SendSmsMessage.call '555-555-5555', 'test message'
    assert_equal 1, TextMessageApi.deliveries.length
  end
end
```

The corresponding test file is equally simple. However, it has much the same problem as the user_test.rb file from the first draft - this test makes a call to an external service. At best, this significantly slows down the test suite run time. At worst, the the API call sends SMS messages every time the test file is run. As we'll see next, the same problem applies to the `NotifyUsers` service.


### Notify Users Service

```
# app/services/notify_users.rb
module Services
  class NotifyUsers
    include Services::Base

    def call(new_user)
      User.emailable_users(exclude = new_user).each do |recipient|
        UserMailer.notify_users(recipient: recipient, new_user: new_user).deliver_now
      end

      User.textable_users(exclude = new_user).each do |recipient|
        Services::SendSmsMessage.call recipient.phone_number, "A new user has been created: #{new_user.email_address}"
      end
    end
  end
end
```

The `NotifyUsers` service is no longer dependent on the creation of a user record and is accessible anywhere in the project

```
# test/services/notify_users_test.rb
require_relative '../test_helper'

class NotifyUsersTest < ActiveSupport::TestCase
  setup do
    (1..3).each{ |n| FactoryGirl.create :user, email_address: "test#{n}@test.com" }
    (1..5).each{ |n| FactoryGirl.create :user, phone_number:   "#{n}#{n}#{n}-#{n}#{n}#{n}#{n}" }

    TextMessageApi.deliveries     = []
    ActionMailer::Base.deliveries = []

    new_user = FactoryGirl.create :user, email_address: "test@test.com", phone_number: "999-9999"
    Services::NotifyUsers.call new_user
  end

  should 'send email notifications' do
    assert_equal 3, ActionMailer::Base.deliveries.length
  end

  should 'send sms notifications' do
    assert_equal 5, TextMessageApi.deliveries.length
  end
end

```

This test file has the same problem as the first draft tests - test are verified by counting the sms messages sent - these counts aren't directly related to the `NotifyUser` code, but rather the `SendSmsMessage` service it depends on. We'll address that in the next step.

### Create User Service

```
# app/services/create_user.rb
module Services
  class CreateUser
    include Services::Base

    def call(params)
      user = User.create params
      Services::NotifyUsers.call user if user.valid?
      user
    end
  end
end
```

The `CreateUser` service replaces the original callback work flow by creating a new user record and sending notification messages.

```
# test/services/create_user_test.rb
require_relative '../test_helper'

class CreateUserTest < ActiveSupport::TestCase
  setup do
    (1..3).each{ |n| FactoryGirl.create :user, email_address: "test#{n}@test.com" }
    (1..5).each{ |n| FactoryGirl.create :user, phone_number:   "#{n}#{n}#{n}-#{n}#{n}#{n}#{n}" }

    TextMessageApi.deliveries     = []
    ActionMailer::Base.deliveries = []

    params = {
      username:      'username',
      email_address: 'test@test.com',
      phone_number:  '555-555-5555'
    }

    @user = Services::CreateUser.call params
  end

  should 'create a new user' do
    assert @user.valid?, 'A valid user should have been created'
  end

  should 'send sms and email notifications' do
    assert_equal 3, ActionMailer::Base.deliveries.length
    assert_equal 5, TextMessageApi.deliveries.length
  end
end

```

Like the `NotifyUsers` test file, these tests also rely on the results of dependent services to validate the correct behavior.


## Third Draft Tests
The latest round of changes improved the logic by splitting it into composable pieces; sort of like rearrangeable Lego blocks. However, the corresponding unit tests still have an issue to be ironed out. The remote calls to the SMS API are problematic: they are slow and result in actual sent messages.

To illustrate the problem, we'll update the `SendSmsMessage` service to print a message to the console declaring that an sms text has been sent.

```
# app/services/send_sms_message.rb
module Services
  class SendSmsMessage
    include Services::Base

    def call(phone_number, message)
      TextMessageApi.send_message phone_number, message
      puts '*** Remote Call'
    end
  end
end
```

When we run `rake test` the output looks like this:

```
..*** Remote Call
*** Remote Call
*** Remote Call
*** Remote Call
*** Remote Call
.*** Remote Call
*** Remote Call
*** Remote Call
*** Remote Call
*** Remote Call
.*** Remote Call
*** Remote Call
*** Remote Call
*** Remote Call
*** Remote Call
.*** Remote Call
*** Remote Call
*** Remote Call
*** Remote Call
*** Remote Call
.*** Remote Call
.
```

This is pretty bad - over twenty sms texts are sent by running the test suite. Not only are users potentially being spammed, remote calls take _time to run_. If you replace the `puts` statement with `sleep 1` to simulate a round trip to a remote server, the test suite becomes unbearably slow.

## Dependency Injection
To address this, we can introduce dependency injection into the tests. This is a decidedly mockist approach, but it keeps tests centered on project code, rather on results returned from remote dependencies outside the project.

There are a number of ways to do this - I'll illustrate a couple approaches using the `NotifyUsers` service. Here it is again:

```
module Services
  class NotifyUsers
    include Services::Base

    def call(new_user)
      User.emailable_users(exclude = new_user).each do |recipient|
        UserMailer.notify_users(recipient: recipient, new_user: new_user).deliver_now
      end

      User.textable_users(exclude = new_user).each do |recipient|
        Services::SendSmsMessage.call recipient.phone_number, "A new user has been created: #{new_user.email_address}"
      end
    end
  end
end
```

The supporting unit tests for this file counts the number of sms messages sent, but notice that this service doesn't directly send those messages - that job is handled by the `SendSmsMessage` service.

First thing we'll do is update the `NotifyUsers` service so that we can override the `SendSmsMessage` service with the class of our choosing:

```
module Services
  class NotifyUsers
    include Services::Base

    def initialize(send_sms_service = Services::SendSmsMessage)
      @send_sms_service = send_sms_service
    end

    def call(new_user)
      User.emailable_users(exclude = new_user).each do |recipient|
        UserMailer.notify_users(recipient: recipient, new_user: new_user).deliver_now
      end

      User.textable_users(exclude = new_user).each do |recipient|
        @send_sms_service.call recipient.phone_number, "A new user has been created: #{new_user.email_address}"
      end
    end
  end
end
```

Rather than call the `SendSmsMessage` service directly, an instance variable is set in the `initialize()` method. This instance variable is used in the `call` method to make the SMS call.

The unit tests are modified to define a fake/mock class that is passed to the `NotifyUsers` service during initialization.

```
require_relative '../test_helper'

class NotifyUsersTest < ActiveSupport::TestCase
  setup do
    (1..3).each{ |n| FactoryGirl.create :user, email_address: "test#{n}@test.com" }
    (1..5).each{ |n| FactoryGirl.create :user, phone_number:   "#{n}#{n}#{n}-#{n}#{n}#{n}#{n}" }

    TextMessageApi.deliveries     = []
    ActionMailer::Base.deliveries = []

    new_user = FactoryGirl.create :user, email_address: "test@test.com", phone_number: "999-9999"

    # Mock sms service is injected into the NotifyUsers service
    @message_service = MockSendSmsMessage.new
    @service         = Services::NotifyUsers.new(@message_service)

    @service.call new_user
  end

  should 'send email notifications' do
    assert_equal 3, ActionMailer::Base.deliveries.length
  end

  should 'send sms notifications' do
    # Instead of counting the message deliveries made, we count the fake
    # deliveries accumulated by the mock object
    assert_equal 5, @message_service.deliveries.length
  end

  # Simulate the SendSmsMessage object
  class MockSendSmsMessage
    attr_accessor :deliveries

    def call(phone_number, message)
      @deliveries ||= []
      @deliveries << message
    end
  end
end
```

Notice the `MockSendSmsMessage` class at the bottom of this file - it accumulates message calls. This count is later referenced in the tests rather than the deliveries made by the actual `SendSmsMessage` service. Because the original service isn't called, we don't need to worry about inadvertently spamming people with text messages. Also, because sms messages aren't sent, the tests run quite quickly.

### Mocha Gem
Rather than build mock objects by hand and managing dependency injection details, another approach is to use a mocking/stubbing library. Rspec comes with this out-of-the-box and  minitest can gain the same capabilities with the <a href="https://rubygems.org/gems/mocha" target="window">Mocha Gem</a>. Start by adding `Gem 'mocha'` to your Gemfile, then require it in `test_helper.rb`

```
# test/test_helper.rb

...

require File.expand_path('../../config/environment', __FILE__)
require 'rails/test_help'

# Add these two lines
require 'minitest/unit'
require 'mocha/mini_test'

...
```

The mocha version of the test file looks like this:

```
require_relative '../test_helper'

class NotifyUsersTest < ActiveSupport::TestCase
  setup do
    (1..3).each{ |n| FactoryGirl.create :user, email_address: "test#{n}@test.com" }
    (1..5).each{ |n| FactoryGirl.create :user, phone_number:   "#{n}#{n}#{n}-#{n}#{n}#{n}#{n}" }

    TextMessageApi.deliveries     = []
    ActionMailer::Base.deliveries = []

    @new_user = FactoryGirl.create :user, email_address: "test@test.com", phone_number: "999-9999"
  end

  should 'send email notifications' do
    Services::NotifyUsers.call @new_user
    assert_equal 3, ActionMailer::Base.deliveries.length
  end

  should 'send sms notifications' do
    Services::SendSmsMessage.expects(:call).times(5)
    Services::NotifyUsers.call @new_user
  end
end
```

This is more concise than the previous version - we define the expectation just before the service call. The `expects` method both stubs `call()` as well as defines how it expects `call()` to be handled. In this case, it should be called five times. There are <a href="http://gofreerange.com/mocha/docs/Mocha/Expectation.html" target="window">quite a few</a> options available to this API.

While this approach allows for much more terse test code, it forces you to have an understanding of how a class works under the hood. Should I know (or care) that `Services::NotifyUsers` calls `Services::SendSmsMessage`? Not really. That is the responsibility of the of the `NotifyUsers` class, while our tests should be concerned purely with its inputs and outputs.

Further, when pushed to the limits, this sort of test can become fragile. What if the `NotifyUsers` implementation changes such that it no longer calls the `SendSmsMessage` service? One wouldn't necessarily know to update the corresponding tests.

The same could be argued about the dependency injection approach. The difference - and this is somewhat semantic - is that with dependency injection the dependency is raised to the service's `initialize()` method signature. If the internals of the service change, the `initialize()` method would change as well, making it plainly obvious that the dependent tests would need to change too.

Ultimately, it is up to you to decide which approach to use. Both have their advantages and draw-backs.

## Conclusion
This somewhat lengthy unit test exploration has shown that:

1. Moving monolithic code into logical chunks results in smaller reusable objects
2. Service objects can lead to more code, but better tested code
3. External dependencies can in some cases lead to undesirable side-effects
4. Dependency injection removes external API execution from the test logic
5. Dependency injection can make tests run faster
6. Mock/stub libraries may be a viable alternative to dependency injection within unit tests

Thank you for sticking with me through this. Please feel free to add your comments below; I'd love to hear what you think.

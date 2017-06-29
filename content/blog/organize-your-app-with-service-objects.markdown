+++
title         = "Organize your app with service objects"
date          = "2016-05-03T17:00:00"
comments      = true
thumbnail     = "images/organize.png"
image_creator = "https://www.flickr.com/photos/b4ey/"
+++
If you have developed in Ruby on Rails for a while, you've probably heard plenty of advocacy for thin controllers. If you've followed through with this philosophy you may have ended up with heavy models instead.
<!--more-->
There are assorted ways to deal with this and Rails does a good job of getting out of the way so you can solve the problem; each has their strengths and weaknesses. Over several projects, I have found service objects keep both models and controllers light-weight and provides an improved level of organization for the project.

Before we dive in, note that this is a multi-part series.<br/>

* Part I: Organize your app with service objects
* <a href="/blog/service-object-test-strategies">Part II: Service Object Test Strategies</a>

What is a service object?
=========================
The details are somewhat subjective, but in general, service objects encapsulate a single chunk of business logic. These objects contain code that would otherwise end up in a controller or model.

For example, let's say you have an admin form to create new users. When a new user is created, assorted recipients are notified via email and others are notified via SMS. Assuming business logic has been extracted from the controller, the model code might look something like this:

{{< highlight ruby >}}
  #app/models/user.rb
  class User < ActiveRecord::Base
    scope :emailable_users, -> {
      where('email_address is not null')
    }

    scope :textable_users, -> {
      where('phone_number is not null')
    }

    after_create :notify_users

    def notify_users
      emailable_users.each do |recipient|
        UserMailer.notify_users(recipient: recipient, new_user: self).deliver
      end

      textable_users.each do |recipient|
        send_text recipient: recipient, new_user: self
      end
    end

    def send_text(new_user: )
      # This is a call to a fictional SMS service
      TextMessageApi.send_message user_user.phone_number, "A new user has been created: #{new_user.email}"
    end
  end
{{< /highlight >}}

There are several problems here:

1. The presence of a callback muddies unit tests - you need to take special precautions to not message users when tests run
2. There may be cases where you want to create a user without sending messages
3. Sending messages are restricted to the context of an instantiated user model
4. Texting API logic is locked inside of the user model and is not usable elsewhere in the system

Let's reorganize this with service objects
===========================================

First, remove the messaging business logic from the model; the only thing left should be scopes.

{{< highlight ruby >}}
  #app/models/user.rb
  class User < ActiveRecord::Base
    scope: emailable_users, -> {
      where('email_address is not null')
    }

    scope: textable_users, -> {
      where('phone_number is not null')
    }
  end
{{< /highlight >}}

Next, move the messaging logic to a new service - it would look something like this:

{{< highlight ruby >}}
  # app/services/notify_users.rb
  module Services
    class NotifyUsers
      def call(new_user)
        User.emailable_users.each do |recipient|
          UserMailer.notify_users(recipient: recipient, new_user: new_user).deliver
        end

        User.textable_users.each do |recipient|
          send_text recipient: recipient, new_user: new_user
        end
      end

      private

      def send_text(new_user: )
        # This is a call to a fictional SMS service
        TextMessageApi.send_message user_user.phone_number, "A new user has been created: #{new_user.email}"
      end
    end
  end
{{< /highlight >}}

The above code is a bit repetitive - the two enumerations are very similar and the parameters passed to the `notify_users` and `send_text` are identical. Bonus points if you can <a href="https://en.wikipedia.org/wiki/Don%27t_repeat_yourself" target="window">DRY</a> the `call` method up a bit.

The texting API call logic is still locked up inside of the `NotifyUsers` service... that too can be a service:

{{< highlight ruby >}}
  # app/services/send_sms_message.rb
  module Services
    class SendSmsMessage
      def call(phone_number, message)
        # This is a call to a fictional SMS service
        TextMessageApi.send_message phone_number, message
      end
    end
  end
{{< /highlight >}}

Now we can freely send SMS messages from anywhere in the app. While it's true one could do this by calling `TextMessageApi.send_message`, We now have a central place through which all SMS logic flows. If you decide to change SMS messaging providers (presumably with different API structures), just change it in this one place - all calls to this service will use the new provider.

With the SMS logic pulled into a dedicated service object, the `NotifyUsers` service looks like this:

{{< highlight ruby >}}
  # app/services/notify_users.rb
  module Services
    class NotifyUsers
      def call(new_user)
        User.emailable_users.each do |recipient|
          UserMailer.notify_users(recipient: recipient, new_user: new_user).deliver
        end

        User.textable_users.each do |recipient|
          Services::SendSmsService.new.call new_user.phone_number, "A new user has been created: #{new_user.email}"
        end
      end
    end
  end
{{< /highlight >}}

The call method
===============
These services are invoked via the `call()` method. This method could be named anything - `perform()` and `process()` are workable alternatives. However, I use `call()` because it is the same method name used by ruby Proc and Lambda objects to invoke their content. This becomes more important when applying functional programming principals to service objects. Also, `call()` can be invoked via shortcut notation:

{{< highlight ruby >}}
  Services::NotifyUsers.new.call(user)
  Services::NotifyUsers.new.(user)
{{< /highlight >}}

Both perform the same operation and look pretty good, but why bother typing `new` over and over. This can be cleaned up a bit with a mixin:

{{< highlight ruby >}}
  # app/services/base.rb
  module Services
    module Base
      def self.included(base)
        base.extend ClassMethods
      end

      module ClassMethods
        def call(*args, &block)
          @instance ||= self.new
          @instance.call *args, &block
       end
      end
    end
  end
{{< /highlight >}}

This module adds adds a `call()` class method that instantiates the service and cached it, then passes the parameters to the instance's `call()` method. Include the module at the top of the service like this:

{{< highlight ruby >}}
  # app/services/notify_users.rb
  module Services
    class NotifyUsers
      include Services::Base

      def call(new_user)
        User.emailable_users.each do |recipient|
          UserMailer.notify_users(recipient: recipient, new_user: new_user).deliver
        end

        User.textable_users.each do |recipient|
          Services::SendSmsService.call new_user.phone_number, "A new user has been created: #{new_user.email}"
        end
      end
    end
  end
{{< /highlight >}}

now you can invoke `call` directly on the class:

{{< highlight ruby >}}
  Services::NotifyUsers.call(user)
  Services::NotifyUsers.(user)
{{< /highlight >}}

One might argue that you may as well just declare service object methods as class methods. This is a valid argument... however, by using a mixin, one still has the option to invoke the service as an instance via `YourService.new.call()`. This can be useful in cases where you want to initialize the service with some stateful data prior to invocation.

How does this look in the context of a controller?

{{< highlight ruby >}}
  # app/controllers/users_controller.rb
   class UsersController < ApplicationController
     def create
       @user = user.create params[:user]

       if @user.valid?
         Services::NotifyUsers.(@user)
         redirect_to admin_users_path
       else
         flash[:error] = "There was a problem creating the user. #{@user.errors.messages}"
         render :edit
       end
     end
   end
{{</ highlight >}}


What have we gained?
====================

Let's take a moment and look over what we've gained:

1. Notifications can be called outside the context of a User instance
2. User unit tests are focused on the concern of users
3. Messaging unit tests are isolated to the concern of messaging
4. Business logic now exists in the dedicated home `app/services`

This looks good, but there's more to do. Because we removed the `after_create` callback from the User model, we have to manually call both `@user.create` as well as `Services::NotifyUsers`.

This requires that the developer remember to send notifications whenever a new user is created. To address this, let's make a service that does both:

{{< highlight ruby >}}
  # app/services/create_user.rb
  module Services
    class CreateUser
      include Services::Base

      def call(user, params)
        user = User.create params[:user]

        if user.valid?
          Services::NotifyUsers.(user)
        end

        user
      end
    end
  end
{{< /highlight >}}

We update the controller by swapping out the `User.create` call with the `CreateUser` service.

{{< highlight ruby >}}
  # app/controllers/users_controller.rb
   class UsersController < ApplicationController
     def create
       @user = Services::CreateUser.(params)

       if @user.valid?
         redirect_to admin_users_path
       else
         flash[:error] = "There was a problem creating the user. #{@user.errors.messages}"
         render :edit
       end
     end
   end
{{</ highlight >}}

Now we have a means to create a user and send notifications at the same time, effectively replacing the original callback code. What's more, at the controller layer of abstraction only one line of code changed.

Conclusion
==========

There's more about services to cover like:

1. Dependency injection to better isolate service logic in unit tests
2. Nesting modules to name space common services together
3. Functional chaining of service objects

We'll cover these in future posts. In the mean time - to review, service objects:

1. Have a single point of entry: `call()`
2. Have one concern and generally represent a single chunk of business logic
3. Contain logic that would otherwise end up in a controller or model
4. Are available throughout the project code and are not restricted to workflows within a single controller or model
5. Simplify tests by narrowing each test file down to a single business concern
6. Are an alternative to potentially convoluted callbacks

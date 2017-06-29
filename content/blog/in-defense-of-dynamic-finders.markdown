+++
title         = "In defense of dynamic finders"
date          = "2013-10-03T16:12:00"
comments      = true
thumbnail     = "images/aikido2.jpg"
image_creator = "https://www.flickr.com/photos/miniprince/"
+++
Last week I had a discussion with a colleague (and talented ruby developer) about the decision to remove dynamic finders from ActiveRecord. This is old news and I'm sure has been hashed to death, but I figured I'd chime in with a few thoughts, now that Rails 4.0 is out and we're moving towards 4.1.<!--more-->

Not long ago, the dynamic finders code was moved into its own gem. This is in sync with the component philosophy that started around Rails 3. It is currently a dependency of ActiveRecord - If you want AR, you still get your finders. Coming up in 4.1 however, you'll have to add it to your Gemfile. Here's <a href="https://github.com/rails/rails/commit/3cc7223f3d57f31affdbabccc86cbc8b6589e2c8" target="window">the commit</a>.

This will hold us over til Rails 5, when the deprecated finders gem will no longer be supported - from the <a href="https://github.com/rails/activerecord-deprecated_finders/blob/master/README.md" target="window">second sentence of its README</a>.

> It will be removed as a dependency in Rails 4.1, but users can manually
> include it in their Gemfile and it will continue to be maintained until Rails 5.

I had a hard time finding historical discourse over dynamic finders and their eventual consignment to death row. Most references I found were about the fact that they were going away and discussions about how to arrange Arel syntax to match dynamic finder behavior. I did find one nugget, which I'll get into below.

The good
========
Dyamic finders were born out of necessity. Rails was designed to change web development from a slow, pain-ridden process into something fun and productive again. Dynamic
finders fit into this by giving us a familiar vocabulary when working with a database.

{{< highlight ruby >}}
  > Post.find_by_subject("What is your favorite color?")
{{< /highlight >}}


{{< highlight sql >}}
  Select *
    From posts
    Where subject = 'What is your favorite color?';
{{< /highlight >}}

Compared to raw SQL, dynamic finders give us a dense, readable syntax. With this in mind, I'm delighted that Rails has provided these finders.

The bad
=======
Despite it's advantages, one can rapidly hit a wall when querying multiple fields.

{{< highlight ruby >}}
  > Person.find_by_name_and_title_and_quest("Arthur", "King of the Britons", "Holy Grail")
{{< /highlight >}}

Or ...

{{< highlight ruby >}}
  > Post.find_by_parent_id_and_orinal_and_is_active(10, 1, true)
{{< /highlight >}}

Given enough facets and long enough field names, dynamic finders rapidly lose their readability. They are also limited - one cannot easily query on the negation of a boolean or query using the SQL "LIKE" clause.

The ugly
========
Under the hood, damning evidence can be seen in the <a href="https://github.com/rails/rails/blob/v3.2.15.rc2/activerecord/lib/active_record/dynamic_matchers.rb" target="window">ActiveRecord source code</a>. Dynamic finders are implemented via method_missing. While flexible, method_missing isn't terribly performance friendly. Having never looked into this before, I was a bit surprised to see this.

I previously thought ActiveRecord evaluated the table structure at load-time and generated various finder methods based on fields from the table. In retrospect, I see that would've been a horrible option considering the number of permutations in a table with many fields.

They aren't really gone
=========================
Consider this from the <a href="https://github.com/rails/activerecord-deprecated_finders/blob/master/README.md" target="window">deprecated finders</a> gem README:

> Note that find(primary_key), find_by..., and
> find_by...! are not deprecated.

So find and find_by are not going away... that helps considerably - here's what DHH had to <a href="https://groups.google.com/forum/#!topic/rubyonrails-core/8loq2zXLoPQ" target="window">say on the matter</a>:

> ...the new dynamic finders are just as good as before:
>           Product.find_by title: "iPad Mini"
> is just as well as:
>           Product.find_by_title "iPad Mini".

This is pretty much what got me on board. This isn't so bad:

{{< highlight ruby >}}
  > Post.find_by :subject => "What is your favorite color?"
{{< /highlight >}}

I am still quite accustomed to the the old hash syntax, but I admit it is clumsy compared to the new hash syntax in this case:

{{< highlight ruby >}}
  > Post.find_by subject: "What is your favorite color?"
{{< /highlight >}}

I can definitely live with this. The only counter-argument I can see is dynamic finder methods use snake_case... just like most other variables and methods in Ruby. I am quite, quite, used to snake_case - the find_by method brakes the snake case flow as I type. This is just a nit and something easily overcome using snippets in my editor.

So where does that leave us? I think find_by will be a sufficient replacement for dynamic finders. Syntactically, it is quite similar and should yield much better performance.

The one part of dynamic finders I will truly miss is find_by_id. I frequently use this in edit and destroy actions to better handle the case where an invalid id is provided. find_by_id returns a nil, rather than raising an exception. I may end up creating some sort of mixin like this:

{{< highlight ruby >}}
  module IdFinder
    extend ActiveSupport::Concern

    module ClassMethods
      def find_by_id(id)
        self.find_by id: id
      end
    end
  end
{{< /highlight >}}

And just add it to the top of my model classes:

{{< highlight ruby >}}
  class Knight
    include IdFinder

     def say_ni!
       ... etc ...
     end
  end
{{< /highlight >}}

Overall, I'm OK with the fate of dynamic finders. They are useful, but there is a reasonable replacement strategy. It will be interesting to see what happens when Rails 5 rolls around. The deprecated finders gem will be unsupported by then, but that doesn't mean a maintainer (or a group of maintainers) won't keep it going. Or maybe not - <a href="https://github.com/datanoise/actionwebservice" target="window">remember ActionWebService</a>?

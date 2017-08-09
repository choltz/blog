+++
date = "2017-07-09T11:15:21-04:00"
title = "Building a functional composition library in ruby - composition operator"
draft = true
thumbnail = "images/cats_cradle.png"
+++
This is one of a multi-part series discussing how to build a functional chaining library in ruby.

* <a href="/blog/functional-composition-in-ruby">Functional Composition in Ruby</a>
* <a href="/blog/building-a-functional-composition-library-in-ruby/">Building a Functional Composition Library in Ruby</a>
* Building a functional composition library in ruby - composition operator (this article)

In the previous article you saw how to transition a series of ruby methods like `map`, `split`, and, `gsub` into individual lambdas and then convert that into a chain of composed functions.

We gained some readability by replacing code like `text.gsub(/\n+/, '')` with meaningully named functions, but the new code was too verbose. Here's where we left off:

{{< highlight ruby >}}
class SomeClass
  include Lightpipe

  def cleanup(content)
    remove_line_feeds = ->(text)  { text.gsub(/\n+/, '') }
    remove_markup     = ->(text)  { text.gsub(/(<([^>]+)>)/, '') }
    split_sentences   = ->(text)  { text.split(/ *\. */) }
    strip             = ->(text)  { text.strip }
    capitalize        = ->(text)  { text.map(&:capitalize) }
    join              = ->(array) { array.join('. ') }

    composition = Function.compose [ strip,
                                     remove_line_feeds,
                                     remove_markup,
                                     split_sentences,
                                     capitalize,
                                     join ]
    composition.call(content)
  end
end
{{< /highlight >}}

This can be clear up a bit by moving the lambdas out into their own functions.

{{< highlight ruby >}}
class SomeClass
  include Lightpipe

  def cleanup(content)
    composition = Function.compose [ strip,
                                     remove_line_feeds,
                                     remove_markup,
                                     split_sentences,
                                     capitalize,
                                     join ]
    composition.call(content)
  end

  def capitalize
    ->(text)  { text.map(&:capitalize) }
  end

  def join
    ->(array) { array.join('. ') }
  end

  def remove_line_feeds
    ->(text)  { text.gsub(/\n+/, '') }
  end

  def remove_markup
    ->(text)  { text.gsub(/(<([^>]+)>)/, '') }
  end

  def split_sentences
    ->(text)  { text.split(/ *\. */) }
  end

  def strip
    ->(text)  { text.strip }
  end
end
{{< /highlight >}}

Using operator overloading, the goal is to change the `cleanup` function to look like this:

{{< highlight ruby >}}
def cleanup(content)
  composition = strip             |
                remove_line_feeds |
                remove_markup     |
                split_sentences   |
                capitalize        |

  composition.call(content)
end
{{< /highlight >}}

... or better yet, to defer execution of the cleanup function, we don't need to call the composition in the function at all.

{{< highlight ruby >}}
def cleanup
  strip             |
  remove_line_feeds |
  remove_markup     |
  split_sentences   |
  capitalize        |
end
{{< /highlight >}}

This is looking pretty good. Let's compare this to the original cleanup method:

```
def cleanup                          def cleanup(text)
  strip             |                  text.strip
  remove_line_feeds |                      .gsub(/\n+/, '')
  remove_markup     |                      .gsub(/(<([^>]+)>)/, '')
  split_sentences   |                      .split(/ *\. */)
  capitalize        |                      .map(&:capitalize)
end                                        .join('. ')
                                     end
```

With functional composition, we can define each step of the transformation and give it a meaningful name. At a glance, you know exactly what the code on the left is doing.

Now that we've shown the goal, let's get back to some code. Much like the compose function defined in the previous article, the operator overload is surprisingly simple. Because we shouldn't monkey-patch the lambda object, we'll put this overload in the Function object - the same function object that defines the compose method. It looks like this:

```
class Function
  ...

  def |(other)
    Function.compose(self, other)
  end

  ...
end

```
All we're doing is defining an override of the pipe `|` symbol and applying the given function to the current function in a compose call.

For this to work in our example, we do need to change each of the support methods to return function objects instead of lambdas:

```
  ...

  def remove_line_feeds
    Function.new { |text|  text.gsub(/\n+/, '') }
  end

  def remove_markup
    Function.new { |text| text.gsub(/(<([^>]+)>)/, '') }
  end

  ...

```

This is what a call to the `cleanup` function looks like:

```
results = cleanup.call "This is an <b>example</b> of\n text. it has formatting issues."
=> "This is an example of text. It has formatting issues."
```

Alternatively, you can use Ruby's proc call shorthand:

```
results = cleanup.("This is an <b>example</b> of\n text. it has formatting issues.")
=> "This is an example of text. It has formatting issues."
```

* Note 1: The parameter you give to a composition should be the same parameter that you would provide the first function in the composition
* Note 2: You need to use the call method when invoking a function - a composition is a Proc, so doesn't execute until you tell it to
* Note 3: This delayed execution is imporant - with it, you can chain this composition into other compositions without invoking the contained code

We've come a long way, this new Function library lets us create clean compositions that have meaningful names and can be composed with any combination of other functions. We also started creating a series of support functions (remove_markup, remove_line_feeds, etc.) that can easily be moved into a common library for re-use.

Like the previous article, there is a dedicated branch on github for <a href="https://github.com/choltz/lightpipe/tree/part_2" target="window">this step of the project</a>.

In upcoming articles we'll continue to enhance the Function class to give more readable feedback in irb and pry, provide short-hand for defining small utility functions, and pull them into a common library for re-use.

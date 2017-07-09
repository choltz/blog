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

We gained some readability by replacing code like `text.gsub(/\n+/, '') }` with meaningully named functions, but the new code was too verbose. Here's where we left off:

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

This can be clear up a bit by moving the lambdas out into their own functions

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



buh
-------------------

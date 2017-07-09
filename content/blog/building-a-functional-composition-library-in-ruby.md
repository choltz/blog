+++
date = "2017-04-08T11:15:21-04:00"
title = "Building a functional composition library in ruby"
draft = true
thumbnail = "images/cats_cradle.png"
+++
This is one of a multi-part series discussing how to build a functional chaining library in ruby.

* <a href="/blog/functional-composition-in-ruby">Functional Composition in Ruby</a>
* Building a Functional Composition Library in Ruby (this article)
* <a href="/blog/building-a-functional-composition-library-in-ruby-composition-operator">Building a functional composition library in ruby - composition operator</a>

Here, we'll start building the librarty - the end result of this discussion will be a Ruby gem that adds functional composition capabilities. The project is named Lightpipe - you can find <a href="https://github.com/choltz/lightpipe" target="window">the source here</a>.

Each installment in this series will have a dedicated branch in the repository. <a href="https://github.com/choltz/lightpipe/tree/part_1" target="window">The code for this article is here</a>.

Dive into some code
-------------------
Let's begin with the example we used in the <a href="/blog/functional-composition-in-ruby">previous article</a>. We start with a vanilla ruby method that cleans up a blob of text it removes, line feeds and html tags, splits on sentences into an array, capitalizes each sentence, then joins everything back together as a string.

```
def cleanup(text)
  text.strip
      .gsub(/\n+/, '')
      .gsub(/(<([^>]+)>)/, '')
      .split(/ *\. */)
      .map(&:capitalize)
      .join('. ')
end
```
Ruby is quite versatile at manipulating text, but this code isn't very self describing. Let's break each of these calls to meaningfully named lambda functions.

```
text              = "This is an <b>example</b> of\n text. it has formatting issues."
remove_line_feeds = ->(text) { text.gsub(/\n+/, '') }
remove_markup     = ->(text) { text.gsub(/(<([^>]+)>)/, '') }
split_sentences   = ->(text) { text.split(/ *\. */) }
strip             = ->(text) { text.strip }
capitalize        = ->(text) { text.map(&:capitalize) }
join              = ->(array) { array.join('. ') }

results = join.call(
  capitalize.call(
    split_sentences.call(
      remove_markup.call(
        remove_line_feeds.call(
          strip.call(text)
        )
      )
    )
  )
)
```
Ok that looks pretty terrible. I formatted the composition call in an indented hierarchy to illustrate a couple points:

1. Nesting function calls gets ugly fast - you end up with a <a href="https://en.wikipedia.org/wiki/Pyramid_of_doom_(programming)" target="window">pyramid of doom</a>
2. The order in which the functions execute is counter-intuitive. One would think the first function in the list is the first to execute, but because we're nesting functions, they execute from the inside out.

Let's address both of these points by building something that composes functions.

Compostion function
-------------------
Let's work backwards for a moment. Using the previous example, this is roughly how we want a composition function to look:

{{< highlight ruby >}}
text    = "This is an <b>example</b> of\n text. it has formatting issues."
remove_line_feeds = ->(text) { text.gsub(/\n+/, '') }
remove_markup     = ->(text) { text.gsub(/(<([^>]+)>)/, '') }
split_sentences   = ->(text) { text.split(/ *\. */) }
strip             = ->(text) { text.strip }
capitalize        = ->(text) { text.map(&:capitalize) }
join              = ->(array) { array.join('. ') }

composition = compose [ strip,
                        remove_line_feeds,
                        remove_markup,
                        split_sentences,
                        capitalize,
                        join ]

composition.call(text)
{{< /highlight >}}

A few points:

1. The functions in the composition execute in the order in which they are listed
2. The deep nesting is gone
3. Execution is deferred until the composition is called

This deferred execution is a key point to composition. A high level of re-use can be achieved by creating focused functions and stitching them together via composition. Instead of immediately executing code, think of this as a box of Legos you assemble - a sort of function construction kit.

We've made progress, but this solution still is too verbose. We'll tighten things up in the next installment in this series. In the mean time, let's build the compose function.

Composition function code
-------------------------
As it turns out, Ruby comes with built-in functions that make this solution very simple and terse. The idea is we want to call one function with an argument, then pass the results to the next function as its parameter... which passes the result to the next function, and so on.

The <a href="https://ruby-doc.org/core-2.1.0/Enumerable.html#method-i-reduce" target="window">reduce function</a> is a perfect match for this workflow. If you aren't familar with reduce, it applies a function to an element in an enumeration and passes the result to the next element.

Expressing a composition with reduce looks something like this:

{{< highlight ruby >}}
text              = "This is an <b>example</b> of\n text. it has formatting issues."
remove_line_feeds = ->(text)  { text.gsub(/\n+/, '') }
remove_markup     = ->(text)  { text.gsub(/(<([^>]+)>)/, '') }
split_sentences   = ->(text)  { text.split(/ *\. */) }
strip             = ->(text)  { text.strip }
capitalize        = ->(text)  { text.map(&:capitalize) }
join              = ->(array) { array.join('. ') }

functions = [ strip,
              remove_line_feeds,
              remove_markup,
              split_sentences,
              capitalize,
              join ]

composition = ->(arg) {
  functions.reduce(arg) do |result, function|
    function.call result
  end
}

composition.call(text)
{{< /highlight >}}

Take note that the reduce call has to be wrapped in a lambda, otherwise we'd lose deferred execution.

Now that we have working code that composes functions, this can be pulled into a common home. In the Lightpipe GEM, it is in <a href="https://github.com/choltz/lightpipe/blob/part_1/lib/lightpipe/function.rb" target="window">function.rb</a>. Here is what this example looks like:


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

This goes a long ways towards practical composition in Ruby, but there more work to do:

1. Designat a functional composition operator and overloading it
2. Extract things like `remove_line_feeds` and `remove_markup` into a re-usable library of functions

Next, we'll talk about the <a href="" target="window">composition operator</a>.

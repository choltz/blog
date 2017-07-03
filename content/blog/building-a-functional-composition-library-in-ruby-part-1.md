+++
date = "2017-04-08T11:15:21-04:00"
title = "Building a Functional Composition Library in Ruby"
draft = true
thumbnail = "images/cats_cradle.png"
+++
This article is one of a multi-part series discussing how to build a functional chaining library in ruby. <a href="/blog/functional-composition-in-ruby">Part I can be found here</a>.

The end result of this discussion will be a Ruby gem that adds functional composition capabilities. The project is named Lightpipe - you can find <a href="https://github.com/choltz/lightpipe" target="window">the source here</a>.

Each installment in this series will be a branch in the git repository. <a href="https://github.com/choltz/lightpipe/tree/part_1">. The source code for this installment is here</a>.

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
Ruby is quite versatile at manipulating text, but the code isn't very self describing. Next we'll break each of these steps into a lambda:

```
text    = "This is an <b>example</b> of\n text. it has formatting issues."
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

assert_equal "This is an example of text. It has formatting issues", results
```
Ok that's pretty ugly. I formatted the composition call in an indented hierarchy to illustrate a couple points:

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

composition = compose strip,
                      remove_line_feeds,
                      remove_markup,
                      split_sentences,
                      capitalize,
                      join

assert_equal "This is an example of text. It has formatting issues", composition.call(text)
{{< /highlight >}}

A few points:
1. The functions in the composition execute in the order in which they are listed
2. The deep nesting is gone
3. Execution is deferred until the composition is called

This deferred execution is a key point to composition. A high level of re-use can be achieved by creating small and very focused functions and stitching them together via composition. Instead of immediately executing code, think of this as a box of Legos you assemble - a sort of function construction kit.

This solution still is too verbose. We'll tighten things up in the next installment in this series. In the mean time, let's build the compose function.

Composition function code
-------------------------
As it turns out, ruby comes with built-in functions that make this solution very simple and terse. The idea is we want to call one function with an argument, then pass the results to the next function as its parameter... which passes the result to the next function, and so on.

The workflow is perfectly described by the <a href="https://ruby-doc.org/core-2.1.0/Enumerable.html#method-i-reduce" target="window">reduce function</a>. If you aren't familar with reduce, it takes an initial value and applies it to the first element of an enumeration, then takes the result and applies it to the next element. Sounds familar right?

Expressing a composition with reduce looks something like this:


{{< highlight ruby >}}
data       = ['key1', '1', 'key2', '2']
to_hash    = ->(array) { Hash[*data] }
key_to_sym = ->(hash)  { hash.reduce({}) { |hash, (key, value)| hash.merge(key.to_sym => value) } }
val_to_num = ->(hash)  { hash.reduce({}) { |hash, (key, value)| hash.merge(key => value.to_i) } }

functions = [to_hash, key_to_sym, val_to_num]

composition = functions.reduce do |result, function|
  function.call result
end

expected = { key1: 1, key2: 2}
assert_equal expected, composition.call(data)
{{< /highlight >}}

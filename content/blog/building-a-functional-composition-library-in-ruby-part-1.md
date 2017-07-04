+++
title         = "Functional composition library in ruby - part 1"
date          = "2017-01-14T16:18:00"
comments      = true
thumbnail     = "images/gears.png"
image_creator = "http://maxpixel.freegreatpicture.com/Machinery-Mechanical-Cogs-Gears-Machine-1236578"
+++
Since Elixir has grown in popularity, I've seen a <a href="http://www.akitaonrails.com/2016/02/18/elixir-pipe-operator-for-ruby-chainable-methods" target="window">few</a> <a href="http://blog.molawson.com/elixir-pipes-in-ruby/" target="window">articles</a> spring up about how the pipe operator `|>` can be implemented in Ruby. I've been writing code with this style in an app at work lately and have found that it can result in readable and simplified code.

<!--more-->

In this article, we'll talk about functional composition in Ruby and look at ways that it can be effectively applied to code. Let's start with a simple example.

How we compose functions in vanilla Ruby
========================================

Chances are you already use functional composition. Let's say you need to clean data received on a POST. There could be leading and trailing spaces, undesirable HTML markup, extra line feeds, and sentences that don't start with capitalized words. What might a clean-up function look like in vanilla ruby?


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

Because the String object has a strip and gsub method and the Array object has both a map and split method, we can chain them. This is not unusual code - Ruby does a good job chaining methods of the same class.

In fact, this feature is a great stepping stone to functional programming and helps make ideas such as <a href="https://en.wikipedia.org/wiki/Tacit_programming" target="window">tacit programming</a> seem relatively natural to Rubyists.

Despite the advantages of method chaining, there are a couple problems.

1. This isn't self documenting - the old joke is that it is <a href="https://en.wikipedia.org/wiki/Write-only_language" target=
"window">write only code</a>
2. We can't add new methods with more meaningful names to the method chain
3. This method does a lot - many tests would be needed to verify all cases

We could satisfy #1 with comments:

```
def cleanup(text)
  text.strip
      .gsub(/\n+/, '')         # remove line feeds
      .gsub(/(<([^>]+)>)/, '') # remove html tags
      .split(/ *\. */)         # split sentences
      .map(&:capitalize)       # capitalize sentences
      .join('. ')              # join sentences
end
```

This gets the job done, but it is preferable for code to be self-describing.

We could move some of this into new methods to improve readability and modularity:

```
def cleanup(text)
  text = remove_line_feeds(text.strip)
  text = remove_html_tags(text)
  capitalize_sentences(text)
end

def remove_line_feeds(text)
  text.gsub(/\n+/, '')
end

def remove_html_tags(text)
  text.gsub(/(<([^>]+)>)/, '')
end

def capitalize_sentences(text)
  text.split(/ *\. */)   # split sentences
      .map(&:capitalize) # capitalize sentences
      .join('. ')        # join sentences
end
```

The cleanup function is more reable and requires less explanatory comments, but we have lost a lot of chainability.

Functions!
==========
Rather than rely on method chaining and the handful of chainable methods ruby provides, we'll build a framework that lets us create our own functions that can be composed into more complicated structures.

Rather than writing code in methods, think of this more in terms of creating a series of small functions that are then used to build more complicated functions - sort of a function construction kit.

The goal is to make our example look something like this:

```
def cleanup
  Fs.strip                |
  Fs.remove_line_feeds    |
  Fs.remove_html_tags     |
  Fs.capitalize_sentences
end
```

Let's take a look at what's going on in this function. Each line is a class function defined in `Fs`, an alias to the class `Functions::String` (described below).

Each of these functions returns a function rather than a value. That is, `Fs.strip` doesn't strip a string, it returns a function that strips a string. That way we can chain (compose) as many functions together as we like lazily, and then execute that composition later.

The pipe `|` is an operator override that calls a compose method that joins the functions together - the output of one function is passed to the input of the next.

Here is what `Functions::String` would look like:

```
module Functions
  class String
    def strip
      Function.new { |text| text.strip }
    end

    def remove_line_feeds
      Function.new { |text| text.gsub(/\n+/, '') }
    end

    def remove_html_tags
      Function.new { |text| text.gsub(/(<([^>]+)>)/, '') }
    end

    def capitalize_sentences
      Functions::Array.split             |
      Functions::Array.map(&:capitalize) |
      Functions::Array.join
    end
  end
```

Instead of using a bunch of one-off gsub calls, we have specifically named reusable functions that can be applied to not just this example, but any other problem that may require text manipulation.

What is the `Function` class in this example? It's a subclass of Proc! Ruby procs already give us deferred execution, so we'll leverage and extend it.

From a console, we can see that each function can be called individually or chained together:

```
> test = '   test1\n test2   '
=> "   test1\n test2   ""
> Fs.strip.call(test)
=> "test1\n test2"
> Fs.remove_line_feeds.call(test)
=> "   test1test2   "
> (Fs.strip | Fs.remove_line_feeds).call(test)
=> "test1test2"
```

Note the last line - the composition has a call method like any other Ruby proc. Compositions can be combined with other compositions - with this we can achieve re-usability.

So... what have we gained?

1. We can write our own chainable functions; we're not restricted to a small number of methods off of String and Array
2. Our functions are composed from smaller, reusable functions
3. The code in `cleanup` is self-describing; no comments are necessary

Where do we go from here?
=========================
Now that the stage has been set, we'll start building this. The `Function` class is just a subclass of `Proc` with syntactic sugar.

Roll up your sleeves and head over to <a href="/blog/building-a-functional-composition-library-in-ruby-part-1">Part 2</a>.

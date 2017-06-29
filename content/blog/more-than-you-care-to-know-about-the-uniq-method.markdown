+++
title         = "More than you care to know about the uniq method"
date          = "2013-09-26T10:35:00"
comments      = true
thumbnail     = "/images/different.jpg"
image         = "different.jpg"
image_creator = "https://www.flickr.com/photos/vassilisonline/"
+++

The other day I was digging through the ruby documentation and stumbled on the uniq method. I was startled to find that you can pass in a block as a parameter. My instinct was to back away slowly, not unlike a cat looking at a bathtub full of water.
<!--more-->
After all, why on Earth would one want to filter uniqueness based on some criteria other than an exact match? Undaunted, I figured it would be fun to explore this method a bit more... find out what makes it tick.

Basic Usage
===========
This is a pretty common method; provided you aren't completely new to Ruby, you've probably seen it plenty:

{{< highlight ruby >}}
  > values = [1,1,2,2,3,3,4,4]
  > values.uniq
  => [1,2,3,4]
{{< /highlight >}}

Or perhaps you've used it with strings:

{{< highlight ruby >}}
  > values = ["a", "a", "b", "b", "c", "c"]
  > values.uniq
  => ["a", "b", "c"]
{{< /highlight >}}

Why not mix things up?

{{< highlight ruby >}}
  > [1, 1, "a", "a", true, true].uniq
  => [1, "a", true]
{{< /highlight >}}

This raises the question - are there any data types that uniq cannot process?

{{< highlight ruby >}}
  > [String, String,\
  >   {:a => 1}, {:a => 1},\
  >   Fixnum, Fixnum,\
  >   Hash.new, Hash.new,\
  >   Object.new, Object.new].uniq
  => [String, {:a=>1}, Fixnum, {}, #<Object:0x89c838c>, #<Object:0x89c8378>]
{{< /highlight >}}

This is quite interesting for a couple reasons. First, notice that uniq works on classes - this makes sense because Ruby classes are first class (pardon the pun) objects. Custom-defined classes work here as well as native classes.

Second, multiple instances of the same classes (Object.new) are treated distinctly and do not reduce to a single object in the returned array. However, multiple instances of the Hash class are reduced, provided they contain the same data:

{{< highlight ruby >}}
  > [ {:a => 1}, {:a => 1}, {:a => 2}].uniq
  => [{:a=>1}, {:a=>2}]
{{< /highlight >}}

How about nested data?

{{< highlight ruby >}}
  > [ {:a => {:b => 1}}, {:a => { :b => 1 }}].uniq
  => [{:a=>{:b=>1}}]
{{< /highlight >}}

Nested hashes reduce to a single element, but only (as we would expect) if the data is identical in each element in the source array:

{{< highlight ruby >}}
  > [ {:a => {:b => Object.new}}, {:a => { :b => Object.new }}].uniq
  => [{:a=>{:b=>#<Object:0x88bbee4>}}, {:a=>{:b=>#<Object:0x88bbea8>}}]
{{< /highlight >}}

Because multiple instances of Object.new are treated as distinct elements by the uniq method, data structures that contain them are treated as distinct as well.

Using Blocks
============
Back to the original point of this article... you can pass a block as a parameter to the uniq method. I was at something of a loss as to why this would be useful - it is doesn't really return a unique set of data. To get a better understanding of this, let's try it out:

{{< highlight ruby >}}
  > data = [{:a => 1, :b => 1},\
            {:a => 1, :b => 2},\
            {:a => 2, :b => 1},\
            {:a => 2, :b => 2}]

  > data.uniq{|d| d[:a]}
  => [{:a=>1, :b=>1}, {:a=>2, :b=>1}]
{{< /highlight >}}

Interesting... based on the block criteria, it appears the uniq returns the first match - in this case, {:a=>1, :b=>1} and {:a=>2, :b=>1}. Change the order of the elements in the array, let's see what happens:

{{< highlight ruby >}}
  > data = [{:a => 1, :b => 2},\
            {:a => 1, :b => 1},\
            {:a => 2, :b => 2},\
            {:a => 2, :b => 1}]

  > data.uniq{|d| d[:a]}
  => [{:a=>1, :b=>2}, {:a=>2, :b=>2}]
{{< /highlight >}}

Uniq continues to return the first match based on the block provided. We can duplicate the uniq-with-a-block behavior by grouping the array using the same block. Then skim off all results in the group except for the first match:

{{< highlight ruby >}}
  > data = [{:a => 1, :b => 1},\
            {:a => 1, :b => 2},\
            {:a => 1, :b => 3},\
            {:a => 2, :b => 1},\
            {:a => 2, :b => 2},\
            {:a => 2, :b => 3}]

  > data.group_by{ |d| d[:a] }.map{ |d| d[1] }.map{ |d| d.first }
  => [{:a=>1, :b=>1}, {:a=>2, :b=>1}]

  > data.uniq{ |d| d[:a] }
  => [{:a=>1, :b=>1}, {:a=>2, :b=>1}]
{{< /highlight >}}

As you can see, the results are the same. That's how this began to make sense to me. Uniq with a block is just a group_by that returns the first match of each group.

I'm not sure I'll find a use for passing a block into uniq, but at the very least it was a fun exercise. If you can think of use cases for this, let me know.

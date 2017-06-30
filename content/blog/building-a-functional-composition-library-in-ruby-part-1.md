+++
date = "2017-04-08T11:15:21-04:00"
title = "Building a Functional Composition Library in Ruby"
draft = true
thumbnail = "images/cats_cradle.png"
+++

created a skeleton gem here:
Each part of this series will correspond to a branch in the repository - if you want to follow along, take a look at the part_1 branch at https://github.com/choltz/lightpipe/tree/part_1.

Let's start by building a compositon using ruby lambdas:

{{< highlight ruby >}}
add_one      = ->(number) { number + 1 }
multiply_two = ->(number) { number * 2 }

# compositon calls one function and passes the result into the next
composition  = multiply_two.call(add_one.call(1))

assert_equal 4, composition
{{< /highlight >}}

Functional composition is simply calling one function, taking the results and passing it into another function. This works for arrays and any other data type as well:

{{< highlight ruby >}}
numbers     = [1,2,3,4]
increment   = ->(array) { array.map{ |i| i + 1 } }
string      = ->(array) { array.map(&:to_s) }

# compositon that passes array values
composition = string.call(increment.call(numbers))

assert_equal ['2', '3', '4', '5'], composition
{{< /highlight >}}

compositions can work across data types. An array to hash for example:

{{< highlight ruby >}}
data       = ['key1', '1', 'key2', '2']
to_hash    = ->(array) { Hash[*data] }
key_to_sym = ->(hash)  { hash.reduce({}) { |hash, (key, value)| hash.merge(key.to_sym => value) } }
val_to_num = ->(hash)  { hash.reduce({}) { |hash, (key, value)| hash.merge(key => value.to_i) } }

composition = val_to_num.call(
  key_to_sym.call(
    to_hash.call(data)
  )
)

expected = { key1: 1, key2: 2}
assert_equal expected, composition
{{< /highlight >}}

For this to work, the data type of the first call must match the expected type of the parameter of the second call.

I formatted the composition call in an indented hierarchy to illustrate a couple points:

1. Nesting function calls gets ugly fast - you end upo with a <a href="https://en.wikipedia.org/wiki/Pyramid_of_doom_(programming)" target="window">pyramid of doom</a>
2. The order in which the functions execute is counter-intuitive. One would think the first function in the list is the first to execute, but because we're nesting functions, they execute from the inside out.

Let's address both of these points by building a compose function.

Compostion function
-------------------

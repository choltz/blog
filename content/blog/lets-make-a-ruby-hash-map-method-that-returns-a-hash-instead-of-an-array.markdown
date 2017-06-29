+++
title         = "let's make a ruby hash map method that returns a hash instead of an array"
date          = "2013-09-07t22:24:00"
comments      = true
thumbnail     = "/images/ruby.png"
image         = "ruby_code.png"
image_creator = "https://www.flickr.com/photos/elliottcable/"
+++
There's this Ruby problem I revisit from time to time. The built-in hash array has a really handy map method. To the uninitiated, the map method is used to modify all elements in an array with the function specified.

<!--more-->
{{< highlight ruby >}}
  > [1,2,3].map{ |i| i+1 }
  => [2, 3, 4]
{{< /highlight >}}

Each element in the array is modified by the block passed into the map method. Similarly, Ruby hashes also have a map method - it does more or less the same thing.

{{< highlight ruby >}}
  > { "x" => 1, "y" => 2, "z" => 3 }.map{ |k,v| k.to_sym => v }
  SyntaxError: (irb):2: syntax error, unexpected tASSOC, expecting '}'

  { "x" => 1, "y" => 2, "z" => 3 }.map{ |k,v| k.to_sym => v }
  from /home/smeagol/.rvm/rubies/ruby-1.9.3-p429/bin/irb:16:in <main>
{{< /highlight >}}

Wait what? Unlike function parameters, you have to wrap your key-value pairs in braces when executing a block like this.

{{< highlight ruby >}}
  > { "x" => 1, "y" => 2, "z" => 3 }.map{ |k,v| { k.to_sym => v } }
  => [{:x=>1}, {:y=>2}, {:z=>3}]
{{< /highlight >}}

Hmmm, marginally better - no error... but this isn't really what we're looking for. The output is an array instead of a hash - the map method signature calls for an array return type. If we want to modify key-value pairs in a hash based on a common pattern, we'll have to look elsewhere. Here's a common idiom:

{{< highlight ruby >}}
  > { "x" => 1, "y" => 2, "z" => 3 }.\
  > inject({}){ |hash, (k, v)| hash.merge( k.to_sym => v )  }
  => {:x=>1, :y=>2, :z=>3}
  > # if you prefer big-data parlance, the preferred term is reduce, not inject.
  > # Either way, Ruby doesn't care - they do the same thing.
  > { "x" => 1, "y" => 2, "z" => 3 }.\
  > reduce({}){ |hash, (k, v)| hash.merge( k.to_sym => v )  }
  => {:x=>1, :y=>2, :z=>3}
{{< /highlight >}}

That works. Our output looks right, but the syntax is really verbose and just looks kind of nasty. Let's throw caution to the wind and monkey-patch the Hash class with a method to simplify the syntax a bit.

{{< highlight ruby >}}
  class Hash
    def hmap(&block)
      self.inject({}){ |hash,(k,v)| hash.merge( block.call(k,v) ) }
    end
  end

  x = { "x" => 1, "y" => 2 }
  x.hmap{ |k,v| { k.to_sym => v.to_s  } }
  => {:x => "1", :y => "2"}
{{< /highlight >}}

Much cleaner. Let's see how it performs.

{{< highlight ruby >}}
  x = {}
  (1..10000).each do |i|
    x["key#{i}"] = i
  end

  t=Time.now
  puts x.hmap{ |k,v| { k.to_sym => v.to_s  } }
  puts "#{Time.now - t} seconds"
  => 31.950418765 seconds
{{< /highlight >}}

Ouch. This is probably fine for many cases - maybe your hash only has a few key-value pairs. Perhaps you're just symbolizing some string-based keys... but we can do better. It turns out, you can map the hash into an array, then pass that array back into a new hash:

{{< highlight ruby >}}
  Hash[x.map {|k, v| [k.to_sym, v.to_s] }]
  =>  0.028062438 seconds
{{< /highlight >}}

That's more like it! Let's wrap this into the hmap() method.

{{< highlight ruby >}}
  class Hash
    def hmap(&block)
      Hash[self.map {|k, v| block.call(k,v) }]
    end
  end

  x.hmap{ |k,v| [ k.to_sym, v ] }
  =>  0.029331384 seconds
{{< /highlight >}}

Awesome. The syntax is slightly different than the inject version - we pass in an array with two cells - one for the key and the other for the value. I think this is a touch more clunky, but the speed improvement is well worth it.

Keep in mind, this is a non-destructive method - you get a new hash when you run it. If we don't want to create a new hash, we'll have to enumerate every key in the hash, create a new key and value based on the block provided and then delete the old key.

{{< highlight ruby >}}
  class Hash
    def hmap!(&block)
      self.keys.each do |key|
        hash = block.call(key, self[key])

        self[hash.keys.first] = hash[hash.keys.first]
        self.delete(key)
      end
      self
    end
  end

  x = { "x" => 1, "y" => 2, "z" => 3 }
  x.hmap!{ |k,v| { k.to_sym => v.to_s } }
  => {:x=>"1", :y=>"2", :z=>"3"}
{{< /highlight >}}

If we run this against the 10,000 key data set from earlier, we decent performance. Not as good, but still not too bad.

{{< highlight ruby >}}
  x = {}
  (1..10000).each do |i|
    x["key#{i}"] = i
  end

  t=Time.now
  x.hmap!{ |k,v| { k.to_sym => v.to_s } }
  puts Time.now - t
  => 0.061217351
{{< /highlight >}}

Depending on the amount of data in your hash, your mileage will vary, but I find this a pretty serviceable addition to the hash class. If you're concerned about monkey-patching, consider including and/or extending this functionality into one of your own classes or instances.

Let me know if you have any other approaches to this problem. I revisit it from time to time and would love to find a way to make the destructive version of hmap!() run faster.

+++
title         = "better syntax hints with flycheck-mode and rubocop"
date          = "2013-08-16T16:18:00"
comments      = true
thumbnail     = "/images/Emacs.png"
image_creator = "https://www.flickr.com/photos/bpprice/"
+++
I've been using flycheck-mode in emacs for about a month now. Out of the box, it does a great job checking the syntax of my code. As I type, it automatically highlights syntax errors and warnings - it looks something like this:

<!--more-->

<figure class="code"> <div class="highlight"><table><tbody><tr><td class="gutter"><pre class="line-numbers"><span class="line-number">1</span>
<span class="line-number">2</span>
<span class="line-number">3</span>
<span class="line-number">4</span>
<span class="line-number">5</span>
</pre></td><td class="code"><pre><code class="ruby"><span class="line"> <span class="k"> class</span> <span class="nc">Contrived</span>
</span><span class="line">    <span class="k">def</span> <span class="nf">sample1</span><span class="p">()</span>
</span><span class="line"> <span style="font-weight: bold; color: orange;">?</span>    <span class="code_warning"><span class="nb">puts</span> <span class="p">(</span><span class="s2">"this is a contrived example"</span><span class="p">)</span></span>
</span><span class="line">    <span class="k">end</span>
</span><span class="line">  <span class="k">end</span>
</span></code></pre></td></tr></tbody></table></div></figure>

flycheck-mode notices that there is a space between the puts statement and the left parenthesis, so it highlights the line. When you cursor over the underlined text, it describes the nature of the warning. Errors are similar, except they are underlined red.

Under the hood, flymake-mode runs the file through the standard ruby interpreter (or jruby interpreter if that's what you are using) to get its results. However - we can do much better. If you've installed the rubocop gem, flycheck-mode will use that for it's syntax checking.

{{< highlight ruby >}}
gem install rubocop
{{< /highlight >}}

Here's the code with rubocop installed:

<figure class="code"> <div class="highlight"><table><tbody><tr><td class="gutter"><pre class="line-numbers"><span class="line-number">1</span>
<span class="line-number">2</span>
<span class="line-number">3</span>
<span class="line-number">4</span>
<span class="line-number">5</span>
</pre></td><td class="code"><pre><code class="ruby"><span class="line"> <span style="font-weight: bold; color: orange;">?</span><span class="k"> <span class="code_warning">class</span></span> <span class="nc">Contrived</span>
</span><span class="line"> <span style="font-weight: bold; color: orange;">?</span>  <span class="k">def</span> <span class="nf">sample1</span><span class="p"><span class="code_warning">()</span></span>
</span><span class="line"> <span style="font-weight: bold; color: orange;">?</span>    <span class="code_warning"><span class="nb">puts</span> <span class="p">(</span><span class="s2">"this is a contrived example"</span><span class="p">)</span></span>
</span><span class="line">    <span class="k">end</span>
</span><span class="line">  <span class="k">end</span>
</span></code></pre></td></tr></tbody></table></div></figure>

The rubocop parser is much more picky. It warns that the class doesn't have a top-level documentation comment, the parenthesis in the method declaration are unnecessary, and double-quote strings aren't needed when there is no string interpolation. If we run rubocop from the terminal, we get this:

{{< highlight bash >}}
  > rubocop
  Inspecting 1 file
  C

  Offences:

  sad.rb:1:1: C: Missing top-level class documentation comment.
  class Contrived
  ^^^^^
  sad.rb:2:14: C: Omit the parentheses in defs when the method doesn't accept any arguments.
    def sample1()
           ^
  sad.rb:3:11: C: Prefer single-quoted strings when you don't need string interpolation or special symbols.
      puts ("this is a contribed example")
        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

  1 file inspected, 3 offences detected
{{< /highlight >}}

Rubocop can be rather heavy-handed - Maybe you don't care if your strings are double-quoted. Fortunately, you can control this by creating a .rubocop.yml file in your project's root directory. You can direct it to create a config file with all it's switches turned off:


{{< highlight ruby >}}
  rubocop --auto-gen-config
{{< /highlight >}}

This will generate the file rubocop-todo.yml. Rename this file to .rubocop.yml and change the settings to your liking.

Both flycheck and rubocop are under development and are surrounded by active communities. Learn more about flycheck-mode here:  http://flycheck.lunaryorn.com and rubocop here: http://batsov.com/rubocop

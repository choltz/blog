+++
title         = "Switch Git Branches by partial name"
date          = "2016-04-27T17:00:00"
comments      = true
thumbnail     = "images/tree_branches.png"
image_creator = "https://www.flickr.com/photos/mustangjoe/"
+++

If you are building an app with a long history, you may have a lot of git branches laying around. Generally you can use your terminal's auto completion to quickly resolve branch names with minimal typing. However, there may be cases where there are branch names that start with the same characters.

With this git alias, you can search your git branches by partial match; then switch to the first match.

{{< highlight bash >}}
[alias]
find-branch = !sh -c \"git branch -a | grep -v remotes | grep $1 | head -n 1 | xargs git checkout\"
{{< /highlight >}}

Put this in your `~/.gitconfig` or project `.git/config` file and then try it out:

{{< highlight bash >}}
  > git find-branch sta
  Switched to branch 'staging'
  Your branch is up-to-date with 'origin/staging'.
{{< /highlight >}}

Switch out "sta" in the example above with whatever partial branch name you like.

So what's going on inside the command? First off - the entire command is embedded in an `!sh` call. This isn't required for simpler git aliases - for instance:

{{< highlight bash >}}
  s       = status --short
  b       = branch
  co      = checkout
  changes = diff --name-status -w
{{< /highlight >}}

However, wrapping the branch switching alias in `!sh` allows us to properly form the parameter in the grep command. The exclamation point tells git the alias should be executed and the `-c` parameter tells sh to run an in-line command.

There are five parts to this command - let's look at each step:

{{< highlight bash >}}
[alias]
find-branch = !sh -c \"git branch -a\"
{{< /highlight >}}

This lists all branches, including remotes:

{{< highlight bash >}}
> git find-branch
master
staging
staging-v1
statging-v2
remotes/origin/staging
remotes/origin/staging-v1
remotes/origin/staging-v2
{{< /highlight >}}

Now let's filter out the remotes - this version operates on local branches only.

{{< highlight bash >}}
[alias]
find-branch = !sh -c \"git branch -a | grep -v remotes\"
{{< /highlight >}}

The output should look something like this:

{{< highlight bash >}}
> git find-branch
master
staging
staging-v1
statging-v2
{{< /highlight >}}

Next we filter the results to match a pattern:

{{< highlight bash >}}
[alias]
find-branch = !sh -c \"git branch -a | grep -v remotes | grep $1\"
{{< /highlight >}}

We're nearly to the results we want:

{{< highlight bash >}}
> git find-branch sta
staging
staging-v1
staging-v2
{{< /highlight >}}

Grab the top result:

{{< highlight bash >}}
[alias]
find-branch = !sh -c \"git branch -a | grep -v remotes | grep $1 | head -n 1\"
{{< /highlight >}}

{{< highlight bash >}}
> git find-branch sta
staging
{{< /highlight >}}

Finally, apply the result to a `git checkout` command.

{{< highlight bash >}}
[alias]
find-branch = !sh -c \"git branch -a | grep -v remotes | grep $1 | head -n 1 | xargs git checkout\"
{{< /highlight >}}

{{< highlight bash >}}
> git find-branch sta
Switched to branch 'staging'
Your branch is up-to-date with 'origin/staging'.
{{< /highlight >}}

That's it. I've found this alias pretty useful in large projects. In the future I may expand this to allow remote branch switching as well. I'd love to hear your thoughts - what variations are there to simplify or augment the alias?

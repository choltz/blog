+++
title         = "Tmux copy and paste"
date          = "2013-07-30T14:13:00"
comments      = true
thumbnail     = "images/school_supplies.png"
image_creator = "https://www.flickr.com/photos/personalcreations/"
+++
If you spend any significant amount of time on a terminal in a *nix operating system, you've probably heard of tmux. For the uninitiated, tmux is a terminal multiplexer: <!--more--> From their site:

> [tmux] lets you switch easily between several programs in one terminal,
> detach them (they keep running in the background) and reattach them
> to a different terminal. And do a lot more.

In addition, tmux lets you split your terminal vertically and horizontally to house multiple terminals side-by-side. You can also go crazy and customize a load of  key bindings if you are so inclined.

One sticking point with tmux is it's ability to interact with the system's clipboard. Generally this involves using a command-line tool such as xclip, but configuration has been somewhat hairy. With tmux 1.8, you can do something like this:

{{< highlight ruby >}}
  bind-key -n -t emacs-copy M-w copy-pipe "xclip -i -sel p -f | xclip -i -sel c "
  bind-key -n C-y run "xclip -o | tmux load-buffer - ; tmux paste-buffer"
{{< /highlight >}}

This gives you something analogous to emacs key bindings for copy and paste. Credit to <a href="http://unix.stackexchange.com/users/37128/jacob" target="window">Jacob</a> for his <a href="http://unix.stackexchange.com/questions/67673/copy-paste-text-selections-between-tmux-and-the-clipboard" target="window">answer</a> on stack exchange.

Try it out - you can get the latest version of tmux from the <a href="http://tmux.sourceforge.net" target="window">tmux website</a>.

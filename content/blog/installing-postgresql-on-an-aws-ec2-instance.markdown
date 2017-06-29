+++
title     = "Installing Postgresql on an AWS EC2 instance"
date      = "2013-08-21T20:31:00"
comments  = true
+++
<!--more-->

Part 1 - setting up the ami
-----------------------------------------------------------------

get an image from here:
https://cloud-images.ubuntu.com/locator/ec2/

for this article we'll use ami-0b8c1f0a - a 64-bit image of ubuntu 13.04
- click the link will take you right to the launch instance dialog if you are logged into aws

add port 22 inbound to security group

create an elastic ip and associated it with the instance

set up your .ssh/config file (or use command switches) to use your new key pem file

ssh into your instance

apt-get update upgrade dist-upgrade

reboot - might take a minute or two to get back up

Part 2 - setting up a persistent ebs volume
-----------------------------------------------------------------
volume type: IOPS
right click on volume and attach to the ec2 instance.

format the volume: sudo mkfs.ext4 /dev/xvdf

add the volume to fstab so it's there on reboot
/dev/xvdf /vol auto noatime 0 0

reboot again - when you're back the new volume will be at /vol

Part 3 - setting up postgresl
-----------------------------------------------------------------

sudo apt-get postgresql

update user credentials:
sudo -u postgres psql postgres
\password postgres
(you will be prompted for the new password)

show data_directory - we'll need this for the next few steps
# /var/lib/postgresql/9.1/main

exit out of psql console and shut postgres down

change the permissions of /vol to postgres:postgres
sudo chown -R postgres:postgres /vol

change to postgres user:
sudo su - postgres

copy contents of that folder (.../main) to /vol
cp -r /var/lib/postgresql/9.1/main/* /vol

now map the new drive to psql data folder. Open /etc/fstab and change the previous entry to:
/dev/xvdf /var/lib/postgresql/9.1/main auto noatime 0 0

move the old postgresql data directory out of the way:
sudo mv /var/lib/postgresql/9.1/main /var/lib/postgresql/9.1/main-old

Reboot!

Set the permissions to the data folder3
sudo chmod 0700 /var/lib/postgresql/9.1/main

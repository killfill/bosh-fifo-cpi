#!/usr/bin/env bash

#Script that copy the fifo cpi to bosh vm.
#TODO: This should probably done by a bosh-release...

REMOTE="$1"
FIFO="10.0.0.50"
USER="nfifo"
PASS="nfifo"

if [ -z "$REMOTE" ]; then
	echo "Usage: $0 BOSH_IP"
	exit 1
fi

echo Coping to $REMOTE ...
rsync -avzr --delete --exclude node_modules . root@${REMOTE}:/var/vcap/jobs/fifo-cpi
ssh root@${REMOTE} "cd /var/vcap/jobs/fifo-cpi; apt-get install -y nodejs npm nodejs-legacy || yum install -y npm; npm install; echo -e \"[fifo_default]\napiversion = 0.1.0\nhost = $FIFO\nuser = $USER\npass = $PASS\n\" > /var/vcap/.fifo; chown vcap:vcap /var/vcap/.fifo"

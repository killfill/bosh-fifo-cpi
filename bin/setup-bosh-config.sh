PATH=$PATH:/usr/sbin/
AGENT_ID=$(mdata-get agent_id)
VM_UUID=$(mdata-get vm_uuid)

#CPI will replace this:
BOSH_HOST=BOSH_HOST_REPLACE
NETWORK_NAME=NETWORK_NAME_REPLACE

#Override openstack mode for dummy mode.
echo dummy > /var/vcap/bosh/etc/infrastructure

#Mount our persistent disk, in /var/vcap/store instead of the default /data.
umount /data
sed -i /vdb1/d /etc/fstab
mkdir -p /var/vcap/store
printf "/dev/vdb1\t\t/var/vcap/store\t\t\text4\tdefaults\t0 0\n" >> /etc/fstab
mount /var/vcap/store

#Prior intent was making bosh-agent hndle the persisten disk, but didnt worked well. problesm with
#VM_UUID is not longer necesarry, but will just keep it there.
# "disks": {
#   "persistent": {
#     "vol-${VM_UUID}": "/dev/vdb"
#   }
# },


#Check if we are deploying bosh micro...
if [[ $AGENT_ID == bm-* ]]; then

cat > /var/vcap/bosh/dummy-cpi-agent-env.json << EOF
{
  "agent_id": "$AGENT_ID",
  "mbus": "https://vcap:b00tstrap@0.0.0.0:6868",
  "blobstore": {
    "provider": "local",
    "options": {
      "blobstore_path": "/var/vcap/micro_bosh/data/cache"
    }
  }
}
EOF

else

#A bosh managed VM
cat > /var/vcap/bosh/dummy-cpi-agent-env.json << EOF
{
  "agent_id": "${AGENT_ID}",
  "mbus": "nats://nats:nats@${BOSH_HOST}:4222",
  "blobstore": {
    "provider": "dav",
    "options": {
      "user": "agent",
      "password": "agent",
      "endpoint": "http://${BOSH_HOST}:25250"
    }
  },
  "networks": {
    "${NETWORK_NAME}": {
      "cloud_properties": {},
      "type": "dynamic"
    }
  },
  "vm": {
    "name": "vm-${AGENT_ID}"
  }
}
EOF

fi

kill `pgrep bosh-agent` || true
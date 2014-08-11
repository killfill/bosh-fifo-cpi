PATH=$PATH:/usr/sbin/
AGENT_ID=$(mdata-get agent_id)
BOSH_HOST=bosh-host

#Ensure bosh-host resolvs to the IP of bosh... 
#TODO: how do i get the IP directly?...

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
    "bosh": {
      "cloud_properties": {},
      "type": "dynamic"
    }
  },
  "vm": {
    "name": "vm-${AGENT_ID}"
  }
}
EOF

kill `pgrep bosh-agent`
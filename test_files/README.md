## Test samples

{"method":"create_vm",

"arguments":[
	"bm-9fb87820-d5dd-49ae-90fc-c108e6c6c73d",
	"quiza_podria_poner_uuid_del_dataset",
	{	"instance_type":"c353c568-69ad-11e3-a248-db288786ea63",
		"instance_size":123123123
	},
	{"bosh":
		{"cloud_properties":
			{"net_id":"8d4d8b0a-e726-4b52-9c5c-0d8a41221ff2"}
			"netmask":null,
			"gateway":null,
			"ip":"10.1.0.240",
			"dns":null,
			"type":"manual",
			"default":["dns","gateway"]
		}
	},
	null,
	{"bosh":{"password":null}}],

"context":{"director_uuid":"bm-9fb87820-d5dd-49ae-90fc-c108e6c6c73d"}}

{"result":"created_vm_uuid","log":"VM created","error":null}



{"method":"set_vm_metadata","arguments":["created_vm_uuid",{"Name":"microboshito"}],"context":{"director_uuid":"bm-9fb87820-d5dd-49ae-90fc-c108e6c6c73d"}}

{"result":"set_vm_metadata_result","log":"set_vm_metadata for vm:created_vm_uuid","error":null}




{"method":"get_vm","arguments":["created_vm_uuid"],"context":{"director_uuid":"bm-9fb87820-d5dd-49ae-90fc-c108e6c6c73d"}}

{"result":{"hello":"get_vm","private_ip_address":"10.1.0.240","floating_ip_address":null},"log":"get_vm for vm: created_vm_uuid","error":null}

db = db.getSiblingDB('admin')
db.createUser ({
    user: "admin",
	pwd: "correcthorsebatterystaple",
	"roles" : [
		"readWriteAnyDatabase",
		"dbAdminAnyDatabase"
	]
})


# Migrate local usercontent


## Usage
1. Setup rclone locally or on the server. Config should look something like this:

```conf
[r2]
type = s3
provider = Cloudflare
access_key_id =
secret_access_key =
endpoint = https://<account_id>.cloudflarestorage.com
acl = private
no_check_bucket = true
```

2. chmod +x ./migrate_local_usercontent.sh
3. export SRC="/usercontent" && ./migrate_local_usercontent.sh

Voila, your files should now have proper content-type and be available on the cloud.

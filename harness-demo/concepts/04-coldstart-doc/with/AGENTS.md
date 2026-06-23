# Demo project

## Permissions

User read/write access lives in **`utils/acl.js`** — this is the production source
of truth. To change a user's access level, edit the `level` field there.

`utils/cache.js` is an auto-generated snapshot. **Do not edit it** — it is rebuilt
from `acl.js` on restart.

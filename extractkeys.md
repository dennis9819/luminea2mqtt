# Extract Keys from iO.e app
## Install iO.e in an android emulator
I've used waydroid (https://waydro.id/#install). I've installed the iO.e app and signed in with my account. The app downloaded all relevant data and stored it in its application data directory on the android device or in this case: the emulator.

## Extract the relevant file
Next step is finding the relevant file. 

```
WAYDROID_ROOT_FS="$HOME/.local/share/waydroid/data/data/com.iosmart.app/shared_prefs"
sudo bash -c "grep s_home_data $WAYDROID_ROOT_FS/preferences_global_key* > /tmp/dump.raw" 
sudo chown $USER /tmp/dump.raw
ls -l /tmp/dump.raw
```

Now we have the raw data extracted. Next step is converting this to a readable json file.

First we have to remove the url encoding for quotes
```
sed -i 's/\&quot\;/\"/gm' /tmp/dump.raw
```
Next, remove the string at the beginning and end of the file:
```
sed -i 's/^.*deviceRespBeen/\{\"data/' /tmp/dump.raw
sed -i 's/<\/string>$//' /tmp/dump.raw
```
Now we can format the file with `jq`
```
cat /tmp/dump.raw | jq

```
This file contains an array of all configured tuya devices including `id`,`key`and `schema`information for decoding dps values. Use it as you wish.
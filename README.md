# Personal webpage: https://juacrumar.es


A personal webpage to keep a nice-to-the-eye cv on The Internets.

While only a small portion of the site needs a backend infrastructure and can be provided as a static site,
this repository also includes the code for running a expressjs server.
It also includes most of the scripts that I have used at several stages when building this page.

I started this project as a way of learning javascript which I think has been successful :)

#### Dev deployement

```
git clone git@github.com:scarlehoff/websito.git
cd websito
npm install
NODE_ENV=production
```

Alternatively you can place the `websito.service` file into `/etc/systemd/system/` and run

```
systemctl daemon-reload
systemctl enable websito
systemctl start websito
```

and check the logs with

```
journalctl -u websito -f
```

Don't forget to modify the working directory and user section to match your configuration!


#### Parse visitors
A log of the visitor with the pages they visit is stored in `log/access.log` and it is rotated every day (normally at 00:00).
The `logReader.js` script offers an automated way for waiting for the rotations and parsing the data to a sqlite database.
The IP of the visitors is stored and some information about location is obtained from https://ipinfo.io/,
the token for ipinfo needs to be provided in a json file: `ipinfodata.json`

```
{ "token" : "TOKEN" }
```

The script that parses the log can be run with:

```
node logReader.js
```

### Server deployment
The deployment of the server is done via the software nginx. 
With nginx it is easy to run the expressjs server in whatever port you want and then proxy the visitors from 80 to 3000
using the files in `/etc/nginx/sites-available/mysite.conf` (remember to create the link to `sites-enable`!!).

In particular, the `juacrumar.es.conf` file for me was:

```
server {                                                                
  server_name www.juacrumar.es;                                       
  return 301 http://juacrumar.es$request_uri; 
  }
  
 server {                                                                
  listen 80;
  listen [::]:80;        
  
  server_name juacrumar.es;
  location / {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;                         
    proxy_set_header Connection 'upgrade';
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header Host $host;                                    
  proxy_cache_bypass $http_upgrade;                               
  }                                                                   
}
```

The first part redirects users from `www.juacrumar.es` to `juacrumar.es` while the second part _proxies_ the user to the expressjs sever.
The line `proxy_set_header X-Real-IP $remote_addr;` is necessary for the expressjs server to have the IP of the visitors.

#### https
Generally speaking, it is safer to always navigate under https. 
The way to do this in nginx is using the certbot, which automates everything (including updating the configuration files).

```
sudo apt install python3-certbot-nginx
sudo certbot --nginx # follow the instructions
sudo systemctl reload nginx
```

And voilà







# Chat Now

## Installation Instructions

### 1. Install MongoDB

- **Step 1.**  https://www.mongodb.com/try/download/community Download the installer from here 

- **Step 2.**  On the Choose setup type screen select *complete* and on the service configuration screen select *Run Service as Network Service User*



## Installing Node.js on Windows

### Step 1: Download Node.js Installer

1. Visit the [Node.js Downloads](https://nodejs.org/en/download/) page.
2. Download the Windows Installer (`.msi`) from the prebuilt-installer section

### Step 2: Run the Installer

1. Double-click the downloaded `.msi` installer file to start the installation.

### Step 3: Setup Node.js

1. Follow the steps in the Node.js Setup Wizard:
   - Click "Next" to begin the installation.
   - Accept the license agreement and click "Next".
   - Choose the installation location or use the default and click "Next".
   - Select the features to install. Ensure "npm package manager" is selected.
   - Click "Next" and then "Install" to start the installation.

### Step 4: Verify Installation

1. Open Command Prompt (or PowerShell) and verify Node.js and npm installation:
   ```bash
   node -v
   npm -v


**IF YOU ARE UNABLE TO INSTALL MONGO DB REACH OUT TO a1879980@adelaide.edu.au for connection URL**
### 2. Clone the Repository

Tested on Nodejs 18.17.1 , NPM 9.6.7

Clone the repository using Git:

```bash
git clone https://github.com/harshu4/Backdoored-Chat.git
cd Backdoored-Chat
```

Start the Backend: 
```bash
npm install --loglevel=error #if this throws error try npm install --legacy-peer-deps

npm start  
```

Start the Frontend:
```bash
cd <Projectdir>/frontend 
npm install --loglevel=error  #if this throws error try npm install --legacy-peer-deps
npm start
```




Further Instructions 

File : ips.json 

Update the file ips.json with key set as servername and value as their IP 


File : .env 

Set env config here 

Mongo_URI : Connect to mongo DB URL

JWT_SECRET : Security Parameter for JWT can be any string

SERVER_NAME :  Name of your own server ex : s10

EXTERNAL_WS_PORT : The port that all other servers are running on ex : 5555 

PORT : The port that you want to run your server on ex : 5555


*The .env has been explosed intenionally and is not a part of the backdoor*


# Known UI bugs, 
- Might need to refresh after signing up 
- Logging out and again logging in with different user, you might need to refresh 
- Flush the data base if you leave it in an inconsitent state

# Tested
This program has been tested to work with 

Group 1 
Group 4
Group 3
Group 11
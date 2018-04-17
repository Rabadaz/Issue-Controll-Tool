const electron = require('electron');
const url = require('url');
const fs = require('fs');
const path = require('path');
const {app, BrowserWindow, Menu, ipcMain} = electron;


let saveP = __dirname + "/issues.json";
let mainWindow; 
let IssueWindow;
let infoWindow;


let data = {
    nextId : 0,
    issues: []
};

app.on('ready' , function(){
    mainWindow = new BrowserWindow({
        height:300,
        width:200
    });

    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'mainWindow.html'),
        protocol: 'file:',
        slashes: true
    }));
    //set to production
    process.env.NODE_ENV = 'production'

    const mainMenu = Menu.buildFromTemplate(mainMenueTemplate);
    Menu.setApplicationMenu(mainMenu);
    let cont = "";

    createShowWindow();
    mainWindow.on("closed" , function(){
        fs.writeFile(saveP , JSON.stringify(data) , function(err){});
        infoWindow.close();app.exit();});

        fs.readFile(saveP, {encoding: 'utf-8'}, function(err,d){
            if(!err){
                   data = JSON.parse(d);   
            }
        });


        mainWindow.webContents.on('did-finish-load', ()=>{
            mainWindow.webContents.send("init" , data);
          });

});


function createShowWindow(){
    infoWindow = new BrowserWindow({
        height: 400,
        width:400,
        show: false,
        closable:true
    });

    infoWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'issueShow.html'),
        protocol: "file",
        slashes: true
    }));

    infoWindow.on('closed', () => {    
        if(!mainWindow.isDestroyed())
            createShowWindow();
    });
}



function IssueAdd(){
    IssueWindow = new BrowserWindow({
        height: 400,
        width: 600,
        title:"add issue"
    });

    IssueWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'issueAdd.html'),
        protocol: "file",
        slashes: true
    }));
}



ipcMain.on('issue:add', function(e,item){
   addIssue(item);
   IssueWindow.close();
});

function addIssue(item)
{
    item.UUID = data.nextId;
    data.nextId++; 
    data.issues.push(item);   
    mainWindow.webContents.send("issue:add" , item);
}


ipcMain.on('issue:show', function(e, item){
    for(o of data.issues){
        if(o.UUID == item){
            showIssueInfo(o);

            break;
        }
    }
});

ipcMain.on('issue:del', (e,item) =>{
        let index = getIndex(item);
        if(index != -1){
            data.issues.splice(index,1);
        }
        if(data.issues.length == 0)
            data.nextId = 0;
        mainWindow.webContents.send("init",data);

});

ipcMain.on('issue:check',(e,item) =>{
    let index = getIndex(item);
    if(index != -1){
        data.issues[index].checked = !data.issues[index].checked;
    }
    mainWindow.webContents.send("init",data);
});


function getIndex(uuid){
    for(var  i = 0; i< data.issues.length;i++){
        if(data.issues[i].UUID == uuid){
            return i;
        }
    }
    return -1;
}



function showIssueInfo(issue){
    infoWindow.show();
    infoWindow.webContents.send("issue:show",issue);
}


const mainMenueTemplate = [
    {
        label:'File',
        submenu:[
           {
                label: 'New Issue',
                accelerator: "Ctrl + N",
                click(){
                    IssueAdd();
                }
            },{
                label: 'Clear',
                click(){
                    data.issues = [];
                    data.nextId = 0;
                    mainWindow.webContents.send("init",data);
                }
            },{
                label: 'Quit',
                click(){
                    app.quit();
                }
            }
        ]
    }

];




if(process.env.NODE_ENV !== 'production'){
    mainMenueTemplate.push({
        label:'Dev',
        submenu:[
            {
                label: 'toggle Dev',
                click(item, focusedWindow){
                    focusedWindow.toggleDevTools();
                }
            },
            {
                label: 'add Test Issues',
                accelerator: "Ctrl + h",
                
                click(){
                    addIssue({
                        head: "Argument Issue",
                        cName:"main.cpp",
                        desc:"No Argument works",
                        lineNr:'234',
                        typ:'Bug',
                        ex:"Wrong Argument Exception",
                        checked:false
                    });
                }
            }
        ]
    });
}
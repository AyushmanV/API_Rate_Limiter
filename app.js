const express=require('express');
const bodyParser=require('body-parser');
const https=require('https');
require('dotenv').config();

const app=express();
app.use(bodyParser.urlencoded({extended:true}));

app.get("/",function(req,res){
    res.sendFile(__dirname+"/index.html");
});

let main_array=[];      // The main array which stores the information of first 20 requests in that particular minute
let wait_array=[];      // The waiting array which stores the excessive requests in that minute to execute in the next minute
let main_count=0;       // The count of number of requests processed in present minute

setInterval(function(){       // This function executes after every one minute
    main_count=wait_array.length;   // The value of main count is made equal to size of wait array  
    main_array=wait_array;          // At the starting of minute the excessive requests in wait array are assigned to main array to exectue first
    wait_array=[];                  // Wait array is made empty after transferring requests to main array   
    if(main_count>=1){
        func();                     // Main array first executes the previous pending requests 
    }
}, 60*1000);                        // Time = 1 minute i.e. 60*1000 seconds

function func(){                    // This is a recursive function that executes all the requests in main array until it's length is zero
    if(main_array.length===0)
    {
        return;
    }
    let req=main_array[0][0];
    let res=main_array[0][1];
    main_array.shift();
    var city=req.body.place;
    var url="https://api.openweathermap.org/data/2.5/weather?q="+city+"&appid="+process.env.API_KEY+"&units=metric";
    https.get(url,function(response){
        response.on('data',function(data){
            var weatherData=JSON.parse(data);//converts string into javascript object with json format
            res.write("<h1>The temperature of " + city + " is " + weatherData.main.temp + " celcius</h1>");
            res.write("<img src='https://openweathermap.org/img/wn/"+weatherData.weather[0].icon+"@2x.png'>");
            res.send();
        })
    });
    func();
}

app.post("/",function(req,res){

    if(wait_array.length===20){
        res.send('Server is busy');     // Sending 'server is busy' if the number of requests are more than 40 (main_count =20 and wait_array size is also 20)
    }

    let arr = Array(2);
    arr[0]=req;
    arr[1]=res;

    if(main_count===20 && wait_array.length<20){     // Wait array starts filling after main count equals 20 
        wait_array.push(arr);
    }
    else{
        main_array.push(arr);                        // Main array is filled until main count is 20
        main_count++;
        if(main_array.length===1)
        {
            func();                                  // Func is called only when main array has size 1, the remaining requests will be processed because func is recursive
        }
    }
});

app.listen(3000);
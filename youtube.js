#!/usr/bin/env node

//title
//totalVids
//actual vids
//view watch time
//views
const puppeteer=require("puppeteer");

let browser;
let page;
let title;
let totalVids;
let noofViews;
let currentVid=0;

(async function automation(){
    try{
        browser= await puppeteer.launch({
            headless:false,
            defaultViewport:null,
            args:["--start-maximized"],
        });
        let pages=await browser.pages();
        page=pages[0];
        await page.goto("https://www.youtube.com/playlist?list=PLzkuLC6Yvumv_Rd5apfPRWEcjf9b1JRnq");
        await page.waitForSelector("#stats>.style-scope.ytd-playlist-sidebar-primary-info-renderer",{visible:true});
        await page.waitForSelector("h1#title",{visible:true});
        let obj =await page.evaluate(function(){
            let allelements=document.querySelectorAll("#stats>.style-scope.ytd-playlist-sidebar-primary-info-renderer");
            let title=document.querySelector("h1#title").innerText;
            let noOfVids=allelements[0].innerText;
            let noofViews=allelements[1].innerText;
            return {noofViews,noOfVids,title}
        });
        totalVids=Number(obj.noOfVids.split(" ")[0]);
        noofViews=obj.noofViews;
        title=obj.title
        let i = 0;
        while ((totalVids - currentVid) > 100) {
            await scrollDown();
            console.log(i);
            i++;
        } 
        await waitTillHTMLRendered(page);
        await scrollDown();
        console.log("Title: ",title,"\nTotal Videos: ",totalVids,"\nActual Videos: ",currentVid);
        await getTable();
    }catch(err){
        console.error(err);
    }
})();

async function getTable(){
    try{
        await page.waitForSelector("[id='video-title']",{visible:true});
        await page.waitForSelector("span.style-scope.ytd-thumbnail-overlay-time-status-renderer",{visible:true});
        let arr=await page.evaluate(function(){
            let allTitle=document.querySelectorAll("[id='video-title']");
            let allTimes=document.querySelectorAll("span.style-scope.ytd-thumbnail-overlay-time-status-renderer");
            let arr=[];
            for(let i=0;i<allTimes.length;i++){
                arr.push({
                    title:allTitle[i].innerText.trim(),
                    duration:allTimes[i].innerText.trim()});
            }
            return arr;
        });
        console.table(arr);
    }catch(err){
        console.error(err);
    }
}

//  html wait 
async function waitTillHTMLRendered(page, timeout = 30000) {
    const checkDurationMsecs = 1000;
    const maxChecks = timeout / checkDurationMsecs;
    let lastHTMLSize = 0;
    let checkCounts = 1;
    let countStableSizeIterations = 0;
    const minStableSizeIterations = 3;

    while (checkCounts++ <= maxChecks) {
        let html = await page.content();
        let currentHTMLSize = html.length;

        let bodyHTMLSize = await page.evaluate(() => document.body.innerHTML.length);

        console.log('last: ', lastHTMLSize, ' <> curr: ', currentHTMLSize, " body html size: ", bodyHTMLSize);

        if (lastHTMLSize != 0 && currentHTMLSize == lastHTMLSize)
            countStableSizeIterations++;
        else
            countStableSizeIterations = 0; //reset the counter

        if (countStableSizeIterations >= minStableSizeIterations) {
            console.log("Page rendered fully..");
            break;
        }

        lastHTMLSize = currentHTMLSize;
        await page.waitForTimeout(checkDurationMsecs);
    }
};

async function scrollDown() {
    let videoSelector = "#video-title";
    let duration = "span.style-scope.ytd-thumbnail-overlay-time-status-renderer";
    await page.waitForSelector(videoSelector, { visible: true });
    await page.waitForSelector(duration, { visible: true });
    let length= await page.evaluate(function () {
        let durationElems = document.querySelectorAll("#video-title");
        durationElems[durationElems.length - 1].scrollIntoView(true);
        return durationElems.length;
    });
    currentVid=length;
  }
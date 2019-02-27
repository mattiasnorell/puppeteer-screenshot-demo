const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const devices = require('puppeteer/DeviceDescriptors');
const devicesToEmulate = [
  {
    'name': 'Desktop 1920x1080',
    'userAgent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.77 Safari/537.36',
    'viewport': {
      'width': 1920,
      'height': 1080
    }
  },
  devices['Pixel 2 XL'],
  devices['iPhone 6'],
  {
    'name': 'Desktop 800x600',
    'userAgent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.77 Safari/537.36',
    'viewport': {
      'width': 800,
      'height': 600
    }
  },
  
  devices['iPad'],
];



function delay(time) {
  return new Promise(function(resolve) { 
      setTimeout(resolve, time)
  });
}

  (async () => {

    if(!process.argv[2]){
      console.log(`Looks like you forgot something`);
      process.exit();
    }

    console.log(`Starting browser...`);
    const browser = await puppeteer.launch({slowMo: 250, headless: true});
    const page = await browser.newPage();
    console.log(`Moving on!`);

    for(let i = 0; i < devicesToEmulate.length; i++){
      var device = devicesToEmulate[i];
      
      console.log(`\nCapturing: ${device.name}`);
  
      await page.emulate(device);
      await page.emulateMedia('screen');
      const dir = './' + device.name;

      const exists = await fs.exists(dir);
      if (!exists){
          await fs.mkdir(dir, (mkDirError) => {
            if (!mkDirError) return;

            if(mkDirError.code == 'EEXIST'){
              
              console.log(` - Folder "${mkDirError.path}" already exist, trying to remove files`)

              fs.readdir(dir, (err, files) => {
                
                if (err) throw err;
              
                for (const file of files) {
                  fs.unlink(path.join(mkDirError.path, file), err => {
                    if (err) throw err;
                  });
                }
              });
            }

            return;
          });
      }

      console.log(` - Loading page`);
      await page.goto(process.argv[2], {waitUntil: 'domcontentloaded'});   
      console.log(` - Page loaded`);
      await delay(100);

      console.log(` - Screenshot 1/5`);
      await page.screenshot({path: dir + '/1 - startpage.png', fullPage: true});
      await page.click('.c-house-selection__content .c-house-selector:nth-child(1) .special-button');
      await delay(500);

      console.log(` - Screenshot 2/5`);
      await page.screenshot({path: dir + '/2 - municipality.png', fullPage: true});
      await page.select('.c-municipality-picker select')

      await page.evaluate(() => {
        document.querySelector('.c-municipality-picker select > option:nth-child(3)').selected = true;
        element = document.querySelector('.c-municipality-picker select');
        var event = new Event('change', { bubbles: true });
        event.simulated=true;
        element.dispatchEvent(event);
      });

      await delay(500);
      await page.click('#start-new-house');
      await page.waitForSelector(".c-overview__content");

      console.log(` - Screenshot 3/5`);
      await page.screenshot({path: dir + '/3 - configurator.jpg', fullPage: true});

      await delay(500);
      await page.click('.c-intro-section__skip-bundles .special-button');
      await delay(500);
      await page.click('.c-intro-section__section .is-bottom .special-button');
    
      await delay(500);
      await page.click('.c-campaign-flyout__close-button .c-HexagonButton');
      await delay(500);

      try{
        await page.click('.b-summary-button-mobile'); // HÄR KOMMER DET GÅ KÄPPRÄTT ÅT FELLOGGEN I 1920
      }catch(ex){
        console.log(`💩 💩 💩 💩 💩  SAKER GICK FEL  💩 💩 💩 💩 💩`);
        continue;
      }
      await delay(500);
      console.log(` - Screenshot 4/5`);
      await page.screenshot({path: dir + '/4 - summary.png', fullPage: true});
      
      await delay(500);
      await page.click('summary-list .c-Collapse-item:nth-child(2) .c-Collapse-item-header');
      await delay(500);
      console.log(` - Screenshot 5/5`);
      await page.screenshot({path: dir + '/5 - summary-open.png', fullPage: true});
    }

    await browser.close();
})();

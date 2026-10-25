// Real local UI with mocked subscription responses. Never contacts the email service.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
const browser=await chromium.launch();const cases=[];
for(const fixture of [{name:'success',status:200},{name:'rate limit',status:429},{name:'service failure',status:500},{name:'offline',abort:true}]){
 const context=await browser.newContext();let posts=0;
 await context.route('**/*',async route=>{const request=route.request();if(request.method()==='POST'){posts++;if(fixture.abort)await route.abort('failed');else await route.fulfill({status:fixture.status,contentType:'application/json',body:JSON.stringify({ok:fixture.status===200})});}else if(/cloudflareinsights/.test(request.url()))await route.fulfill({status:204,body:''});else await route.continue();});
 const page=await context.newPage();await page.goto('http://127.0.0.1:4326/');const box=page.locator('[data-capture]').first();
 await box.locator('button').click();assert.equal(posts,0,'empty email must not submit');
 await box.locator('[name=email]').fill('local-test@example.invalid');await box.locator('button').click();
 if(fixture.status===200){await box.locator('[data-capture-done]').waitFor({state:'visible'});assert.equal(await box.locator('[data-capture-link]').getAttribute('href'),'/cheat-sheet');}
 else {await box.locator('[data-capture-msg]').waitFor({state:'visible'});assert.equal(await box.locator('button').isEnabled(),true);assert.equal(await box.locator('[data-capture-body] a[href="/cheat-sheet"]').count(),1);}
 assert.equal(posts,1);cases.push({name:fixture.name,pass:true,postIntercepted:true,realEmailSent:false});await context.close();
}
await browser.close();await writeFile('evidence/email-capture.json',JSON.stringify({method:'Local Chromium; all POSTs intercepted with fixtures; email service not contacted',cases},null,2)+'\n');console.log(`${cases.length} mocked email UI cases passed; zero email-service requests.`);

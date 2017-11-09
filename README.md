# chjhs-line-bot
靜心小學 一年孝班 Line bot


## Local run 方法
- 在.env 檔中設定各個環境參數的值
- 執行前先跑`npm run build`來透過babel compile
- 執行 `heroku local`
- 如果想執行crawler , 請在 Procfile 中把 `npm start` 改為 `npm run crawler`  

## Deploy 方法
- 確認 Procfile 中有執行 `npm run build`
- git push heroku master

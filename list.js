///<reference path="./lib/jquery-3.2.1.min.js" />

(function () {
  const totalCount = 100; // 处理总条数
  const batchItem = 10; // 每批处理数，阈值可配
  let curBatchItem = batchItem; // 当前处理项
  let curBatchList = []; // 当前批处理列表

  const mockRequest = true; // 是否mock请求
  const testUrl = "http://bff.beta.eshetang.com/heartbeatCheck"; // 要压测的url

  new Vue({
    el: "#app",
    data: {
      successList: [],
      errorList: [],
      successCount: 0,
      errorCount: 0,
    },
    mounted() {
      this.init();
    },
    methods: {
      init: async function () {
        console.time("处理总耗时");

        await this.renderBatchInit();

        console.timeEnd("处理总耗时");
      },
      renderBatchInit: async function () {
        return new Promise(async (resolve, reject) => {
          const batchPromiseList = [];
          for (let i = 1; i <= batchItem; i++) {
            batchPromiseList.push(
              mockRequest ? this.mockAjax(i) : this.testAjax(i)
            );
          }

          const data = await Promise.all([...batchPromiseList]);

          resolve(data);
        });
      },
      renderNextItem: async function () {
        if (curBatchList.length < batchItem && curBatchItem < totalCount) {
          if (mockRequest) {
            await this.mockAjax(++curBatchItem);
          } else {
            await this.testAjax(++curBatchItem);
          }
        }
      },
      testAjax: async function (i) {
        curBatchList.push(i);

        const reqTimeStart = new Date().getTime();

        const res = await axios.get(testUrl);

        const reqTimeEnd = new Date().getTime();

        const result = {
          cur: i,
          time: reqTimeEnd - reqTimeStart,
          curBatchList: curBatchList,
          curBatchListCount: curBatchList.length,
          success: res.data.code === 200 ? 1 : 0,
        };

        curBatchList = curBatchList.filter((cur) => cur !== i);

        this.renderErrorList(result, i);

        await this.renderNextItem();

        return result;
      },
      mockAjax: async function (i) {
        return new Promise((resolve, reject) => {
          // mock 接口的处理时间为500ms以内
          const random = Math.floor(Math.random() * 500);

          curBatchList.push(i);

          setTimeout(async () => {
            const result = {
              cur: i,
              time: random,
              curBatchList: curBatchList,
              curBatchListCount: curBatchList.length,
              success: random < 200 ? 1 : 0,
            };

            curBatchList = curBatchList.filter((cur) => cur !== i);

            this.renderErrorList(result, i);

            await this.renderNextItem();

            resolve(result);
          }, random);
        });
      },
      // vue.js 处理
      renderErrorList: function (result, cur) {
        if (!mockRequest && totalCount > 100) {
          if (cur % 100 === 0) {
            console.log(result, "[result]");
          }
          return;
        }
        console.log(result);

        const isError = !result.success;

        if (isError) {
          this.errorCount++;
          this.errorList.push(result);
          // this.errorList.sort((prev, next) => prev.cur - next.cur);
        } else {
          this.successCount++;
          this.successList.push(result);
          // this.successList.sort((prev, next) => prev.cur - next.cur);
        }
      },
    },
  });
})();

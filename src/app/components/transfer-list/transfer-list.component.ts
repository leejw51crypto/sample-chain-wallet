import { Component, OnInit, ViewEncapsulation } from "@angular/core";
import BigNumber from "bignumber.js";
import { WalletService } from "src/app/services/wallet.service";
import * as _ from "lodash";
import { Transaction } from "src/app/types/transaction";

@Component({
  selector: "app-transfer-list",
  templateUrl: "./transfer-list.component.html",
  styleUrls: ["./transfer-list.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class TransferListComponent implements OnInit {
  constructor(private walletService: WalletService) {}
  settings = {
    refresh: true,
    hideSubHeader: true,
    attr: {
      class: "txn-history",
    },
    pager: {
      perPage: 10,
    },
    actions: {
      add: false,
      edit: false,
      delete: false,
    },
    columns: {
      txHash: {
        title: "TxHash",
        sort: false,
      },
      blockHeight: {
        title: "Block",
        filter: false,
        sortDirection: "desc",
      },

      affectedAddress: {
        title: "Affected address",
        sort: false,
      },
      txType: {
        title: "TxType",
        sort: false,
      },
      value: {
        title: "Value",
        filter: false,
      },
    },
  };
  data: Transaction[] = [];
  decryptedFlag: boolean;
  ngOnInit() {
    this.walletService.getWalletTxnHistory().subscribe((walletTxnHistory) => {
      this.data = [];
      walletTxnHistory.forEach((history) => {
        console.log(`history ${JSON.stringify(history)}`);
        let outputs = history["outputs"];
        let inputs = history["inputs"];

        if (outputs.length > 0) {
          let address = outputs[0]["address"];
          const tmpData: Transaction = {
            txHash: "0x" + history["transaction_id"],
            blockHeight: history["block_height"],
            age: history["block_time"],
            affectedAddress: address,
            txType: history["transaction_type"],
            action: history["kind"] === "Incoming" ? "In" : "Out",
            value: new BigNumber(history["value"])
              .dividedBy("100000000")
              .toString(10),
          };
          this.data.push(tmpData);
        } else {
          let address = inputs[0]["address"];
          const tmpData: Transaction = {
            txHash: "0x" + history["transaction_id"],
            blockHeight: history["block_height"],
            age: history["block_time"],
            affectedAddress: address,
            txType: history["transaction_type"],
            action: history["kind"] === "Incoming" ? "In" : "Out",
            value: new BigNumber(history["value"])
              .dividedBy("100000000")
              .toString(10),
          };
          this.data.push(tmpData);
        }
      });
    });

    this.walletService
      .getDecryptedFlag()
      .subscribe((decryptedFlag) => (this.decryptedFlag = decryptedFlag));
  }
}

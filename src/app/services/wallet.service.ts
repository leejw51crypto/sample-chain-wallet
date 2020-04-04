import { Injectable } from "@angular/core";
import { Observable, of, throwError, BehaviorSubject, Subject } from "rxjs";
import BigNumber from "bignumber.js";
import * as lodash from "lodash";

import { Wallet } from "../types/wallet";
import { TransactionFromRpc } from "../types/transaction";
import { HttpClient } from "@angular/common/http";
import * as _ from "lodash";

@Injectable({
  providedIn: "root"
})
export class WalletService {
  private walletList = new BehaviorSubject<Wallet[]>([]);
  private selectedWalletId = new BehaviorSubject<string>("");
  private selectedWallet = new BehaviorSubject<Wallet>(null);
  private decryptedFlag = new BehaviorSubject<boolean>(false);
  private walletBalance = new BehaviorSubject<string>("");
  private walletAddress = new BehaviorSubject<string>("");
  private walletViewKey = new BehaviorSubject<string>("");
  private walletTxnHistory = new BehaviorSubject<TransactionFromRpc[]>([]);
  private coreUrl = "http://127.0.0.1:9981";
  constructor(private http: HttpClient) {
    console.log("wallet service");
    localStorage.setItem('data', 'ok');
    console.log(localStorage.getItem('data'));
    this.selectedWalletId.subscribe(walletId => {
      // TODO: What if wallet id cannot be found?
      this.selectedWallet.next(
        this.walletList.getValue().find(wallet => wallet.id === walletId)
      );
    });
  }

  decrypt(passphrase: string, walletEnckey: string): Observable<boolean> {
    let result = new BehaviorSubject<boolean>(null);
    let selectedWalletId: string;
    console.log("decrypt passphrase=%s  enckey=%s", passphrase, walletEnckey);
    this.getSelectedWallet().subscribe(
      selectedWallet => (selectedWalletId = selectedWallet.id)
    );

    this.syncWallet(selectedWalletId, passphrase, walletEnckey).subscribe(data => {      
      console.log("sync wallet result=%s", JSON.stringify(data["result"]));
      if (_.isUndefined(data["result"])) {
        result.next(false);
      } else {
        console.log("check balance");
        this.checkWalletBalance(selectedWalletId, passphrase, walletEnckey).subscribe(data => {
          if (_.isNil(data["result"])) {
            result.next(false);
          } else {
            console.log("balance=%s", JSON.stringify(data));
            const balance = new BigNumber(data["result"]["total"])
              .dividedBy("100000000")
              .toString(10);
            console.log(data["result"]);
            console.log(balance);
            this.setWalletBalance(balance);
            this.setDecryptedFlag(true);
            result.next(true);
            this.checkWalletAddress(selectedWalletId, passphrase, walletEnckey).subscribe(
              data => {
                this.setWalletAddress(data["result"][0]);
              }
            );
            this.checkWalletViewKey(selectedWalletId, passphrase, walletEnckey).subscribe(
              data => {
                this.setWalletViewKey(data["result"]);
              }
            )
            this.checkWalletTxnHistory(selectedWalletId, passphrase, walletEnckey).subscribe(
              data => {
                this.setWalletTxnHistory(data["result"]);
              }
            );
          }
        });
      }
    });

    return result;
  }

  addWallet(id: string, passphrase: string, mnemonics: string): Observable<string> {
    console.log("add wallet id=%s password=%s mnemonics=%s", id, passphrase, mnemonics)

    if (this.isWalletIdDuplicated(id)) {
      return throwError(new Error("Duplicated wallet id"));
    }

    

    if (mnemonics!=undefined && mnemonics.length>0) {
      console.log("addWallet mnemonics=%s (%d)", mnemonics, mnemonics.length)
      return this.http.post<string>(this.coreUrl, {
        jsonrpc: "2.0",
        id: "jsonrpc",
        method: "wallet_restore",
        params: [
          {
            name: id,
            passphrase: _.isNil(passphrase) ? "" : passphrase
          },
          mnemonics
        ]
      });

    }

    console.log("create wallet");

    return this.http.post<string>(this.coreUrl, {
      jsonrpc: "2.0",
      id: "jsonrpc",
      method: "wallet_create",
      params: [
        {
          name: id,
          passphrase: _.isNil(passphrase) ? "" : passphrase
        },
        "HD"
      ]
    });
  }

  private isWalletIdDuplicated(id: string): boolean {
    return !lodash.isUndefined(
      this.walletList.getValue().find(wallet => wallet.id === id)
    );
  }

  syncWallet(walletId: string, passphrase: string,  enckey:string): Observable<string> {
    console.log("sync wallet id=%s passphrase=%s  enckey=%s",walletId, passphrase, enckey);
    return this.http.post<string>(this.coreUrl, {
      jsonrpc: "2.0",
      id: "jsonrpc",
      method: "sync",
      params: [
        {
          name: walletId,
          passphrase: _.isNil(passphrase) ? "" : passphrase,
          enckey: _.isNil(passphrase) ? "" : enckey,
        }
      ]
    });
  }

  syncWalletList() {
    const walletListFromClient = [];
    this.http
      .post(this.coreUrl, {
        jsonrpc: "2.0",
        id: "jsonrpc",
        method: "wallet_list"
      })
      .subscribe(
        data => {
          data["result"].forEach(wallet => {
            walletListFromClient.push({ id: wallet });
          });
          this.walletList.next(walletListFromClient);
        },
        error => {
          console.log("Error", error);
        }
      );
  }

  checkWalletBalance(walletId: string, passphrase: string, enckey: string): Observable<string> {
    return this.http.post<string>(this.coreUrl, {
      jsonrpc: "2.0",
      id: "jsonrpc",
      method: "wallet_balance",
      params: [
        {
          name: walletId,
          passphrase: _.isNil(passphrase) ? "" : passphrase,
          enckey: _.isNil(passphrase) ? "" : enckey
        }

      ]
    });
  }
  checkWalletAddress(walletId: string, passphrase: string, enckey:string): Observable<string> {
    console.log('checkWalletAddress %s %s %s', walletId, passphrase, enckey);
    return this.http.post<string>(this.coreUrl, {
      jsonrpc: "2.0",
      id: "jsonrpc",
      method: "wallet_listTransferAddresses",
      params: [
        {
          name: walletId,
          passphrase: _.isNil(passphrase) ? "" : passphrase,
          enckey: _.isNil(passphrase) ? "" : enckey
        }
      ]
    });
  }

  checkWalletViewKey(walletId: string, passphrase: string, enckey: string): Observable<string> {
    return this.http.post<string>(this.coreUrl, {
      jsonrpc: "2.0",
      id: "jsonrpc",
      method: "wallet_getViewKey",
      params: [
        {
          name: walletId,
          passphrase: _.isNil(passphrase) ? "" : passphrase,
          enckey: _.isNil(passphrase) ? "" : enckey
        }
      ]
    });
  }

  checkWalletTxnHistory(walletId: string, passphrase: string, enckey: string) {
    return this.http.post<string>(this.coreUrl, {
      jsonrpc: "2.0",
      id: "jsonrpc",
      method: "wallet_transactions",
      params: [
        {
          name: walletId,
          passphrase: _.isNil(passphrase) ? "" : passphrase,
          enckey: _.isNil(passphrase) ? "" : enckey
        },        0,1000,false
      ]
    });
  }

  getWalletList(): Observable<Wallet[]> {
    return this.walletList.asObservable();
  }

  selectWalletById(id: string) {
    this.selectedWalletId.next(id);
  }

  getSelectedWallet(): Observable<Wallet> {
    return this.selectedWallet;
  }

  setDecryptedFlag(flag: boolean) {
    this.decryptedFlag.next(flag);
  }

  getDecryptedFlag(): Observable<boolean> {
    return this.decryptedFlag;
  }

  setWalletBalance(balance: string) {
    this.walletBalance.next(balance);
  }

  getWalletBalance(): Observable<string> {
    return this.walletBalance;
  }
  setWalletAddress(address: string) {
    this.walletAddress.next(address);
  }

  getWalletAddress(): Observable<string> {
    return this.walletAddress;
  }

  setWalletViewKey(address: string) {
    this.walletViewKey.next(address);
  }

  getWalletViewKey(): Observable<string> {
    return this.walletViewKey;
  }

  setWalletTxnHistory(txnHistory: TransactionFromRpc[]) {
    this.walletTxnHistory.next(txnHistory);
  }

  getWalletTxnHistory(): Observable<TransactionFromRpc[]> {
    return this.walletTxnHistory;
  }
  sendToAddress(
    walletId: string,
    passphrase: string,
    toAddress: string,
    amount: string,
    viewKeys: string[],
  ): Observable<string> {
    return this.http.post<string>(this.coreUrl, {
      jsonrpc: "2.0",
      id: "jsonrpc",
      method: "wallet_sendToAddress",
      params: [
        {
          name: walletId,
          passphrase: _.isNil(passphrase) ? "" : passphrase
        },
        toAddress,
        amount,
        viewKeys,
      ]
    });
  }

  pingClientRPC(): Observable<string> {
    return this.http.post<string>(this.coreUrl, {
      jsonrpc: "2.0",
      id: "jsonrpc"
    });
  }
}


import { Component, OnInit, TemplateRef } from "@angular/core";
import { BsModalRef, BsModalService } from "ngx-bootstrap/modal";

import { Wallet } from "../../types/wallet";
import { WalletService } from "../../services/wallet.service";
import * as _ from "lodash";

@Component({
  selector: "app-wallet-list",
  templateUrl: "./wallet-list.component.html",
  styleUrls: ["./wallet-list.component.scss"]
})
export class WalletListComponent implements OnInit {
  modalRef: BsModalRef;
  modalConfig = {
    backdrop: true,
    ignoreBackdropClick: true
  };
  walletList: Wallet[];
  selectedWallet: Wallet;

  constructor(
    private modalService: BsModalService,
    private walletService: WalletService
  ) {}

  ngOnInit() {
    this.walletService.getWalletList().subscribe(walletList => {
      this.walletList = walletList;
    });

    this.walletService
      .getSelectedWallet()
      .subscribe(selectedWallet => (this.selectedWallet = selectedWallet));
  }

  selectWallet(walletId: string) {
    console.log("select wallet");
    this.walletService.selectWalletById(walletId);
    this.walletService.setDecryptedFlag(false);
  }

  openModal(template: TemplateRef<any>, walletId?: string) {
  
    localStorage.setItem("current_wallet", walletId);
    this.modalRef = this.modalService.show(template, this.modalConfig);
    if (!_.isNil(walletId)) {      
      this.walletService.selectWalletById(walletId);
      this.walletService.setDecryptedFlag(false);
    }
    
    
    return false;
  }

  closeModal() {
    this.modalRef.hide();
  }

  async test() {
    console.log("start waiting");
    this.walletService.getWalletList().subscribe(walletList => {
      var i =0;
      for (i=0;i<walletList.length;i++) {

        console.log("wallet %d/%d %s",i, walletList.length, JSON.stringify(walletList[i]));
      }
      
    });
    
  }
  listWallets() {
    console.log("list wallets2");  
    this.test();
    this.walletService.syncWalletList();  
    
  }
}  

import { Component, OnInit, Input, Output, EventEmitter } from "@angular/core";
import BigNumber from "bignumber.js";

import { WalletService } from "src/app/services/wallet.service";
import { Wallet } from "src/app/types/wallet";
import { NgForm } from "@angular/forms";
//import { timingSafeEqual } from 'crypto';

export interface FundSent {
  walletId: string;
  amount: BigNumber;
  toAddress: string;
}
enum Status {
  PREPARING = "PREPARING",
  CONFIRMING = "CONFIRMING",
  SENDING = "SENDING",
  BROADCASTED = "BROADCASTED",
  SENT = "SENT",
}
@Component({
  selector: "app-send-funds-form",
  templateUrl: "./send-funds-form.component.html",
  styleUrls: ["./send-funds-form.component.scss"],
})
export class SendFundsFormComponent implements OnInit {
  walletList: Wallet[];

  @Input() walletId: string;
  @Input() walletBalance: string;
  @Input() amount: BigNumber;
  amountValue: string;
  @Input() toAddress: string;
  @Input() viewKey: string;
  walletPassphrase: string;
  walletEnckey: string;

  @Output() sent = new EventEmitter<FundSent>();
  @Output() cancelled = new EventEmitter<void>();

  private status: Status = Status.PREPARING;
  private walletBalanceBeforeSend = "";
  private sendToAddressApiError = false;

  constructor(private walletService: WalletService) {}

  ngOnInit() {
    var walletid = localStorage.getItem("current_wallet");
    this.walletPassphrase = localStorage.getItem(`${walletid}_passphrase`);
    this.walletEnckey = localStorage.getItem(`${walletid}_enckey`);

    this.viewKey = localStorage.getItem("send_viewkey");
    this.toAddress = localStorage.getItem("send_toAddress");
    this.amountValue = localStorage.getItem("send_amountValue");

    if (this.amount) {
      this.amountValue = this.amount.toString(10);
    }
    this.walletService.getWalletBalance().subscribe((balance) => {
      this.walletBalance = balance;
    });
  }

  handleAmountChange(amount: string): void {
    this.amount = new BigNumber(amount);
  }

  handleConfirm(form: NgForm): void {
    this.walletPassphrase = form.value.walletPassphrase;
    this.walletEnckey = form.value.walletEnckey;

    this.markFormAsDirty(form);
    this.sendToAddressApiError = false;
    if (form.valid) {
      this.confirm();
    }
  }

  confirm(): void {
    localStorage.setItem("send_viewkey", this.viewKey);
    localStorage.setItem("send_toAddress", this.toAddress);
    localStorage.setItem("send_amountValue", this.amountValue);
    this.status = Status.CONFIRMING;
  }

  handleSend(form: NgForm): void {
    this.send();
  }

  markFormAsDirty(form: NgForm) {
    Object.keys(form.controls).forEach((field) => {
      form.controls[field].markAsDirty();
    });
  }

  send(): void {
    this.walletBalanceBeforeSend = this.walletBalance;
    this.status = Status.SENDING;
    const amountInBasicUnit = new BigNumber(this.amountValue)
      .multipliedBy("100000000")
      .toString(10);

    this.walletService
      .sendToAddress(
        this.walletId,
        this.walletPassphrase,
        this.walletEnckey,
        this.toAddress,
        amountInBasicUnit,
        [this.viewKey]
      )
      .subscribe((data) => {
        if (data["error"]) {
          this.status = Status.PREPARING;
          // TODO: Distinguish from insufficient balance?
          this.sendToAddressApiError = true;
        } else {
          setTimeout(() => {
            this.checkTxAlreadySent();
          }, 3000);
        }
      });
  }

  checkTxAlreadySent() {
    // TODO: Should use more reliable way to check for transaction confirmed
    this.walletService
      .decrypt(this.walletPassphrase, this.walletEnckey)
      .subscribe(() => {
        if (this.walletBalance === this.walletBalanceBeforeSend) {
          this.status = Status.BROADCASTED;
        } else {
          this.status = Status.SENT;
        }
      });
  }

  closeAfterSend(): void {
    this.sent.emit({
      walletId: this.walletId,
      amount: this.amount,
      toAddress: this.toAddress,
    });
  }

  cancel(): void {
    this.cancelled.emit();
  }
}

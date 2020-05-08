import { Component, OnInit, Input, Output, EventEmitter } from "@angular/core";
import BigNumber from "bignumber.js";

import { WalletService } from "src/app/services/wallet.service";
import { Wallet } from "src/app/types/wallet";
import { NgForm } from "@angular/forms";

export interface FundSent {
  walletId: string;
  amount: BigNumber;
  fromAddress: string;
}
enum Status {
  PREPARING = "PREPARING",
  CONFIRMING = "CONFIRMING",
  SENDING = "SENDING",
  BROADCASTED = "BROADCASTED",
  SENT = "SENT",
}
@Component({
  selector: "app-unbond-funds-form",
  templateUrl: "./unbond-funds-form.component.html",
  styleUrls: ["./unbond-funds-form.component.scss"],
})
export class UnbondFundsFormComponent implements OnInit {
  walletList: Wallet[];

  @Input() walletId: string;

  @Input() amount: BigNumber;
  amountValue: string;
  bondedAmount: string;
  unbondedAmount: string;
  @Input() fromAddress: string;

  walletPassphrase: string;
  walletEnckey: string;
  senderViewKey: string;

  @Output() sent = new EventEmitter<FundSent>();
  @Output() cancelled = new EventEmitter<void>();

  private status: Status = Status.PREPARING;

  private sendToAddressApiError = false;

  constructor(private walletService: WalletService) {}

  ngOnInit() {
    this.walletService.loadFromLocal();
    this.walletPassphrase = this.walletService.walletPassphrase;
    this.walletEnckey = this.walletService.walletEnckey;

    this.fromAddress = "0xa4f1632e81718a2f49ea3f724ff5ce2a37c916df";
    this.amountValue = "1";

    this.bondedAmount = "0";
    this.unbondedAmount = "0";

    this.walletService
      .getWalletViewKey()
      .subscribe((walletViewKey) => (this.senderViewKey = walletViewKey));

    if (this.amount) {
      this.amountValue = this.amount.toString(10);
    }

    this.fetchStakingAccount();
  }

  async fetchStakingAccount() {
    console.log("fetch staking account");
    var data = await this.walletService
      .checkStakingStake(this.fromAddress)
      .toPromise();
    console.log("received=", JSON.stringify(data));
    var result = data["result"];
    if (result) {
      var bonded = result["bonded"];
      var unbonded = result["unbonded"];

      this.bondedAmount = this.walletService.convertFromBasicToCro(bonded);
      this.unbondedAmount = this.walletService.convertFromBasicToCro(unbonded);
    } else {
      this.bondedAmount = "0";
      this.unbondedAmount = "0";
    }
  }

  handleAmountChange(amount: string): void {
    this.amount = new BigNumber(amount);
  }

  async handleFromAddress(address: string) {
    console.log(`handle from address ${address}`);
    this.fromAddress = address;
    this.fetchStakingAccount();
  }

  handleConfirm(form: NgForm): void {
    this.walletPassphrase = form.value.walletPassphrase;

    this.markFormAsDirty(form);
    this.sendToAddressApiError = false;
    if (form.valid) {
      this.confirm();
    }
  }

  confirm(): void {
    this.walletService.saveToLocal();
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

  async send() {
    this.status = Status.SENDING;
    const amountInBasicUnit = new BigNumber(this.amountValue)
      .multipliedBy("100000000")
      .toString(10);

    this.walletEnckey = (
      await this.walletService.checkWalletEncKey(
        this.walletId,
        this.walletPassphrase
      )
    )["result"];

    this.walletService
      .unbondFromAddress(
        this.walletId,
        this.walletPassphrase,
        this.walletEnckey,
        this.fromAddress,
        amountInBasicUnit
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

  async checkTxAlreadySent() {
    // TODO: Should use more reliable way to check for transaction confirmed
    var _data = await this.walletService.decrypt(
      this.walletPassphrase,
      this.walletEnckey
    );

    this.status = Status.SENT;
  }

  closeAfterSend(): void {
    this.sent.emit({
      walletId: this.walletId,
      amount: this.amount,
      fromAddress: this.fromAddress,
    });
  }

  cancel(): void {
    this.cancelled.emit();
  }
}

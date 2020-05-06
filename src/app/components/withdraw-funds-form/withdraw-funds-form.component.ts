import { Component, OnInit, Input, Output, EventEmitter } from "@angular/core";
import BigNumber from "bignumber.js";

import { WalletService } from "src/app/services/wallet.service";
import { Wallet } from "src/app/types/wallet";
import { NgForm } from "@angular/forms";

export interface FundSent {
  walletId: string;
  toAddress: string;
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
  selector: "app-withdraw-funds-form",
  templateUrl: "./withdraw-funds-form.component.html",
  styleUrls: ["./withdraw-funds-form.component.scss"],
})
export class WithdrawFundsFormComponent implements OnInit {
  walletList: Wallet[];

  @Input() walletId: string;
  @Input() walletBalance: string;

  amountValue: string;
  @Input() toAddress: string;
  @Input() fromAddress: string;
  @Input() viewKey: string;
  walletPassphrase: string;
  walletEnckey: string;
  senderViewKey: string;

  @Output() sent = new EventEmitter<FundSent>();
  @Output() cancelled = new EventEmitter<void>();

  private status: Status = Status.PREPARING;
  private walletBalanceBeforeSend = "";
  private sendToAddressApiError = false;

  constructor(private walletService: WalletService) {}

  ngOnInit() {
    this.walletService.loadFromLocal();
    this.walletPassphrase = this.walletService.walletPassphrase;
    this.walletEnckey = this.walletService.walletEnckey;

    this.viewKey =
      "03fe7108a0c6f1dfae943d0193f56d6a5957cd391458d74016b8383c472c6c70d0";
    this.fromAddress = "0x7b9a6a0892b00a29f41e11ab15d6e94f9b74245c";
    this.toAddress =
      "dcro1z4u70rl36unrkrmahcvrdc74w26x4h70vcdsqx5lq377dtq2sjhsfjna75";
    this.amountValue = this.walletService.sendAmount;

    this.walletService
      .getWalletViewKey()
      .subscribe((walletViewKey) => (this.senderViewKey = walletViewKey));

    this.walletService.getWalletBalance().subscribe((balance) => {
      this.walletBalance = balance;
    });
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
    this.walletService.sendViewkey = this.viewKey;
    this.walletService.sendToAddressString = this.toAddress;
    this.walletService.sendAmount = this.amountValue;
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
    this.walletBalanceBeforeSend = this.walletBalance;
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

    var data = await this.walletService
      .withdrawToAddress(
        this.walletId,
        this.walletPassphrase,
        this.walletEnckey,
        this.fromAddress,
        this.toAddress,
        [this.senderViewKey, this.viewKey]
      )
      .toPromise();

    if (data["error"]) {
      this.status = Status.PREPARING;
      // TODO: Distinguish from insufficient balance?
      this.sendToAddressApiError = true;
    } else {
      setTimeout(() => {
        this.checkTxAlreadySent();
      }, 3000);
    }
  }

  async checkTxAlreadySent() {
    // TODO: Should use more reliable way to check for transaction confirmed
    var _data = await this.walletService.decrypt(
      this.walletPassphrase,
      this.walletEnckey
    );

    if (this.walletBalance === this.walletBalanceBeforeSend) {
      this.status = Status.BROADCASTED;
    } else {
      this.status = Status.SENT;
    }
  }

  closeAfterSend(): void {
    this.sent.emit({
      walletId: this.walletId,
      toAddress: this.toAddress,
      fromAddress: this.fromAddress,
    });
  }

  cancel(): void {
    this.cancelled.emit();
  }
}

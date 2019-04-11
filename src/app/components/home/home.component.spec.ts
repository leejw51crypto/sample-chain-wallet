import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { FormsModule } from "@angular/forms";
import { Ng2SmartTableModule } from "ng2-smart-table";
import { AngularFontAwesomeComponent } from "angular-font-awesome";
import { ModalModule } from "ngx-bootstrap/modal";

import { HomeComponent } from "./home.component";
import { TxnHistoryComponent } from "../txn-history/txn-history.component";
import { WalletListComponent } from "../wallet-list/wallet-list.component";
import { WalletInfoComponent } from "../wallet-info/wallet-info.component";
import { SendFundsFormComponent } from "../send-funds-form/send-funds-form.component";
describe("HomeComponent", () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        HomeComponent,
        TxnHistoryComponent,
        WalletListComponent,
        WalletInfoComponent,
        AngularFontAwesomeComponent,
        SendFundsFormComponent
      ],
      imports: [Ng2SmartTableModule, FormsModule, ModalModule.forRoot()]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});

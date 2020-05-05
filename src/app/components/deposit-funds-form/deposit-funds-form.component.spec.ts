import { async, ComponentFixture, TestBed } from "@angular/core/testing";
import { FormsModule } from "@angular/forms";
import { AngularFontAwesomeComponent } from "angular-font-awesome";

import { DepositFundsFormComponent } from "./deposit-funds-form.component";
import { SufficientBalanceValidatorDirective } from "./sufficient-balance.directive";
import { AddressValidatorDirective } from "src/app/shared/address.directive";

describe("DepositFundsFormComponent", () => {
  let component: DepositFundsFormComponent;
  let fixture: ComponentFixture<DepositFundsFormComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        DepositFundsFormComponent,
        AngularFontAwesomeComponent,
        AddressValidatorDirective,
        SufficientBalanceValidatorDirective,
      ],
      imports: [FormsModule],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DepositFundsFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});

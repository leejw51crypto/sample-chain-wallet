import { async, ComponentFixture, TestBed } from "@angular/core/testing";
import { FormsModule } from "@angular/forms";
import { AngularFontAwesomeComponent } from "angular-font-awesome";

import { UnbondFundsFormComponent } from "./unbond-funds-form.component";
import { SufficientBalanceValidatorDirective } from "./sufficient-balance.directive";
import { AddressValidatorDirective } from "src/app/shared/address.directive";

describe("UnbondFundsFormComponent", () => {
  let component: UnbondFundsFormComponent;
  let fixture: ComponentFixture<UnbondFundsFormComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        UnbondFundsFormComponent,
        AngularFontAwesomeComponent,
        AddressValidatorDirective,
        SufficientBalanceValidatorDirective,
      ],
      imports: [FormsModule],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UnbondFundsFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoleCreateEdit } from './role-create-edit';

describe('RoleCreateEdit', () => {
  let component: RoleCreateEdit;
  let fixture: ComponentFixture<RoleCreateEdit>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoleCreateEdit]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RoleCreateEdit);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { Component, computed, effect, inject, input, signal } from "@angular/core";
import { FormField, FormRoot, form, required } from "@angular/forms/signals";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { Router, RouterLink } from "@angular/router";
import { VaultStore } from "../../vault/vault.store";

interface CredentialFormModel {
  name: string;
  username: string;
  domain: string;
  password: string;
  notes: string;
}

const EMPTY_MODEL: CredentialFormModel = {
  name: "",
  username: "",
  domain: "",
  password: "",
  notes: "",
};

const REQUIRED_MESSAGES: Record<keyof Omit<CredentialFormModel, "notes">, string> = {
  name: "Name is required.",
  username: "Username is required.",
  domain: "Domain is required.",
  password: "Password is required.",
};

type RequiredField = keyof typeof REQUIRED_MESSAGES;

@Component({
  selector: "credential-form",
  imports: [
    FormField,
    FormRoot,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    RouterLink,
  ],
  templateUrl: "./credential-form.html",
  styleUrl: "./credential-form.css",
})
export class CredentialForm {
  protected readonly store = inject(VaultStore);
  private readonly router = inject(Router);

  protected readonly id = input<string>();
  protected readonly attempted = signal(false);

  private readonly model = signal<CredentialFormModel>({ ...EMPTY_MODEL });
  private prefilled = false;
  private saving = false;

  protected readonly credForm = form(
    this.model,
    (fields) => {
      required(fields.name, { message: REQUIRED_MESSAGES.name });
      required(fields.username, { message: REQUIRED_MESSAGES.username });
      required(fields.domain, { message: REQUIRED_MESSAGES.domain });
      required(fields.password, { message: REQUIRED_MESSAGES.password });
    },
    {
      submission: {
        action: async () => {
          if (this.saving) {
            return;
          }
          this.saving = true;
          const id = this.id();
          if (id) {
            this.store.update(id, { ...this.model() });
            await this.router.navigate(["/credentials", id]);
          } else {
            this.store.add({ ...this.model() });
            await this.router.navigate(["/"]);
          }
        },
        onInvalid: () => {
          this.attempted.set(true);
        },
      },
    },
  );

  protected readonly isEdit = computed(() => this.id() !== undefined);
  protected readonly credential = computed(() => {
    const id = this.id();
    return id ? this.store.getById(id) : undefined;
  });

  constructor() {
    effect(() => {
      if (this.prefilled) {
        return;
      }
      const credential = this.credential();
      if (credential) {
        this.model.set({
          name: credential.name,
          username: credential.username,
          domain: credential.domain,
          password: credential.password,
          notes: credential.notes,
        });
        this.prefilled = true;
      }
    });
  }

  protected fieldError(field: RequiredField): string | undefined {
    if (!this.attempted()) {
      return undefined;
    }
    return this.credForm[field]().errors()[0]?.message ?? REQUIRED_MESSAGES[field];
  }

  protected async cancel(): Promise<void> {
    const id = this.id();
    await this.router.navigate(id ? ["/credentials", id] : ["/"]);
  }
}

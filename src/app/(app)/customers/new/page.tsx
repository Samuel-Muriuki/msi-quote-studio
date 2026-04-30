import { NewCustomerForm } from "./new-customer-form";

export default function NewCustomerPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-10 sm:px-8 sm:py-14">
      <header className="space-y-2">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-text-secondary">
          New customer
        </p>
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-text">
          Add a customer
        </h1>
        <p className="text-sm text-text-secondary">
          Save a contact you quote against often. Email and notes carry through to the
          quote detail and the eventual emailed PDF.
        </p>
      </header>

      <div className="mt-10">
        <NewCustomerForm />
      </div>
    </div>
  );
}

import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CustomerAddressForm } from "./customer-address";

afterEach(cleanup);

describe("valfri kundadress", () => {
  it("accepterar att kunden lämnar samtliga adressuppgifter tomma", () => {
    const onSave = vi.fn();
    render(<CustomerAddressForm onSave={onSave} />);
    fireEvent.click(screen.getByRole("button", { name: "Spara exempeladress" }));
    expect(onSave).toHaveBeenCalledWith({ street: "", postalCode: "", city: "" });
  });
  it("tar emot kundens adressuppgifter", () => {
    const onSave = vi.fn();
    render(<CustomerAddressForm onSave={onSave} />);
    fireEvent.change(screen.getByLabelText("Gatuadress"), { target: { value: "Testgatan 1" } });
    fireEvent.change(screen.getByLabelText("Postnummer"), { target: { value: "123 45" } });
    fireEvent.change(screen.getByLabelText("Ort"), { target: { value: "Teststad" } });
    fireEvent.click(screen.getByRole("button", { name: "Spara exempeladress" }));
    expect(onSave).toHaveBeenCalledWith({ street: "Testgatan 1", postalCode: "123 45", city: "Teststad" });
  });
});
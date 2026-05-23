import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, MapPin, Plus, Trash2, Edit2, CheckCircle2, XCircle } from "lucide-react";
import { useSavedAddresses, useCreateSavedAddress, useUpdateSavedAddress, useDeleteSavedAddress, SavedAddressInsert } from "@/hooks/useSavedAddresses";
import { usePincodeLookup } from "@/hooks/usePincodeLookup";
const POSTAL_CODE_RE = /^[1-9][0-9]{5}$/;
const PHONE_RE = /^[+]?[0-9]{10,15}$/;

export function AddressBook() {
  const { data: addresses = [], isLoading } = useSavedAddresses();
  const deleteAddress = useDeleteSavedAddress();
  const [editingAddress, setEditingAddress] = useState<SavedAddressInsert & { id?: string } | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleAddNew = () => {
    setEditingAddress({
      label: "Home",
      full_name: "",
      phone: "",
      address_line1: "",
      address_line2: "",
      city: "",
      state: "",
      postal_code: "",
      country: "India",
      is_default: addresses.length === 0, // First address is default
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (address: any) => {
    setEditingAddress({
      ...address,
      phone: address.phone || "",
      address_line2: address.address_line2 || "",
      state: address.state || "",
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h3 className="font-display text-lg font-medium">Saved Addresses</h3>
          <p className="text-sm text-muted-foreground">Manage your delivery addresses</p>
        </div>
        <Button type="button" onClick={handleAddNew} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add New
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : addresses.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-8 text-center">
          <MapPin className="mx-auto h-8 w-8 text-muted-foreground opacity-50 mb-3" />
          <p className="text-sm text-muted-foreground mb-4">No saved addresses found.</p>
          <Button type="button" variant="outline" onClick={handleAddNew}>
            Add your first address
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {addresses.map((addr) => (
            <div key={addr.id} className="relative rounded-xl border border-border p-4 shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">{addr.label}</span>
                  {addr.is_default && (
                    <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      Default
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => handleEdit(addr)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteAddress.mutate(addr.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-1 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">{addr.full_name}</p>
                {addr.phone && <p>{addr.phone}</p>}
                <p className="mt-2">{addr.address_line1}</p>
                {addr.address_line2 && <p>{addr.address_line2}</p>}
                <p>{addr.city}, {addr.state} {addr.postal_code}</p>
                <p>{addr.country}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingAddress?.id ? "Edit Address" : "Add New Address"}</DialogTitle>
          </DialogHeader>
          {editingAddress && (
            <AddressFormContent 
              address={editingAddress} 
              onChange={setEditingAddress} 
              onClose={() => setIsDialogOpen(false)} 
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AddressFormContent({
  address,
  onChange,
  onClose,
}: {
  address: SavedAddressInsert & { id?: string };
  onChange: (data: SavedAddressInsert & { id?: string }) => void;
  onClose: () => void;
}) {
  const createAddress = useCreateSavedAddress();
  const updateAddress = useUpdateSavedAddress();
  const { status, lookupError, fetchPincode, resetStatus } = usePincodeLookup();

  const handlePincodeChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const pin = e.target.value.trim();
      onChange({ ...address, postal_code: pin });
      resetStatus();
      if (pin.length === 6 && POSTAL_CODE_RE.test(pin)) {
        const result = await fetchPincode(pin);
        if (result) {
          onChange({
            ...address,
            postal_code: pin,
            city: result.city,
            state: result.state,
            country: result.country,
          });
        }
      }
    },
    [address, onChange, fetchPincode, resetStatus]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (address.postal_code.length !== 6 || !POSTAL_CODE_RE.test(address.postal_code)) return;
    if (status === "invalid") return;
    
    if (address.phone && !PHONE_RE.test(address.phone.replace(/[\s\-().]/g, ""))) return;

    if (address.id) {
      await updateAddress.mutateAsync(address as any);
    } else {
      await createAddress.mutateAsync(address);
    }
    onClose();
  };

  const isSaving = createAddress.isPending || updateAddress.isPending;
  const phoneDigits = (address.phone || "").replace(/[\s\-().]/g, "");
  const phoneInvalid = address.phone && address.phone.length > 0 && !PHONE_RE.test(phoneDigits);

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="label">Label (Home, Work, etc)</Label>
          <Input id="label" value={address.label} onChange={(e) => onChange({ ...address, label: e.target.value })} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="full_name">Full Name</Label>
          <Input id="full_name" value={address.full_name} onChange={(e) => onChange({ ...address, full_name: e.target.value })} required />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <Input 
          id="phone" 
          type="tel"
          value={address.phone || ""} 
          onChange={(e) => onChange({ ...address, phone: e.target.value })} 
          required 
          className={phoneInvalid ? "border-destructive" : ""}
        />
        {phoneInvalid && <p className="text-xs text-destructive">Enter a valid 10-15 digit phone number</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="postal_code">Pincode</Label>
        <div className="relative">
          <Input
            id="postal_code"
            value={address.postal_code}
            onChange={handlePincodeChange}
            required
            maxLength={6}
            inputMode="numeric"
            className={[
              "pr-9",
              status === "invalid" || (address.postal_code.length === 6 && !POSTAL_CODE_RE.test(address.postal_code)) ? "border-destructive" : "",
            ].join(" ")}
          />
          {status === "loading" && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
          {(status === "invalid" || (address.postal_code.length === 6 && !POSTAL_CODE_RE.test(address.postal_code))) && status !== "loading" && (
            <XCircle className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-destructive" />
          )}
        </div>
        {status === "loading" && <p className="text-xs text-muted-foreground">Verifying PIN code...</p>}
        {address.postal_code.length === 6 && !POSTAL_CODE_RE.test(address.postal_code) && <p className="text-xs text-destructive">Enter a valid 6-digit PIN.</p>}
        {status === "invalid" && address.postal_code.length === 6 && POSTAL_CODE_RE.test(address.postal_code) && <p className="text-xs text-destructive">PIN not found in records.</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="address_line1">Flat, House no., Building</Label>
        <Input id="address_line1" value={address.address_line1} onChange={(e) => onChange({ ...address, address_line1: e.target.value })} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="address_line2">Area, Street, Sector (Optional)</Label>
        <Input id="address_line2" value={address.address_line2 || ""} onChange={(e) => onChange({ ...address, address_line2: e.target.value })} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input id="city" value={address.city} onChange={(e) => onChange({ ...address, city: e.target.value })} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="state">State</Label>
          <Input 
            id="state" 
            value={address.state || ""} 
            onChange={(e) => onChange({ ...address, state: e.target.value })} 
            required 
            placeholder={status === "loading" ? "Fetching..." : ""}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2">
        <input 
          type="checkbox" 
          id="is_default" 
          checked={address.is_default} 
          onChange={(e) => onChange({ ...address, is_default: e.target.checked })}
          className="h-4 w-4 rounded border-input"
        />
        <Label htmlFor="is_default" className="font-normal cursor-pointer">Set as default address</Label>
      </div>

      <div className="pt-4 flex justify-end gap-3">
        <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={isSaving || status === "invalid" || phoneInvalid}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Address
        </Button>
      </div>
    </form>
  );
}

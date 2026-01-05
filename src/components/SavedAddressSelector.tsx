import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useSavedAddresses, useCreateSavedAddress, useDeleteSavedAddress, SavedAddress } from "@/hooks/useSavedAddresses";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, MapPin, Trash2, Check } from "lucide-react";

interface SavedAddressSelectorProps {
  onAddressSelect: (address: {
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
    phone: string;
  }) => void;
}

export function SavedAddressSelector({ onAddressSelect }: SavedAddressSelectorProps) {
  const { user } = useAuth();
  const { data: addresses = [] } = useSavedAddresses();
  const createAddress = useCreateSavedAddress();
  const deleteAddress = useDeleteSavedAddress();
  
  const [selectedId, setSelectedId] = useState<string>("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    label: "Home",
    full_name: "",
    phone: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "India",
    is_default: false,
  });

  if (!user) return null;

  const handleSelectAddress = (addressId: string) => {
    setSelectedId(addressId);
    const address = addresses.find((a) => a.id === addressId);
    if (address) {
      const nameParts = address.full_name.split(" ");
      onAddressSelect({
        firstName: nameParts[0] || "",
        lastName: nameParts.slice(1).join(" ") || "",
        address: [address.address_line1, address.address_line2].filter(Boolean).join(", "),
        city: address.city,
        postalCode: address.postal_code,
        country: address.country,
        phone: address.phone || "",
      });
    }
  };

  const handleAddAddress = async () => {
    await createAddress.mutateAsync(newAddress);
    setShowAddForm(false);
    setNewAddress({
      label: "Home",
      full_name: "",
      phone: "",
      address_line1: "",
      address_line2: "",
      city: "",
      state: "",
      postal_code: "",
      country: "India",
      is_default: false,
    });
  };

  if (addresses.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-4">
        <p className="text-sm text-muted-foreground mb-3">
          Save your address for faster checkout next time
        </p>
        <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Address
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Address</DialogTitle>
            </DialogHeader>
            <AddressForm
              address={newAddress}
              onChange={setNewAddress}
              onSubmit={handleAddAddress}
              isLoading={createAddress.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Saved Addresses</Label>
        <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm">
              <Plus className="mr-1 h-4 w-4" />
              Add New
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Address</DialogTitle>
            </DialogHeader>
            <AddressForm
              address={newAddress}
              onChange={setNewAddress}
              onSubmit={handleAddAddress}
              isLoading={createAddress.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      <RadioGroup value={selectedId} onValueChange={handleSelectAddress}>
        <div className="space-y-2">
          {addresses.map((address) => (
            <div
              key={address.id}
              className={`relative rounded-lg border p-4 ${
                selectedId === address.id ? "border-primary" : "border-border"
              }`}
            >
              <div className="flex items-start gap-3">
                <RadioGroupItem value={address.id} id={address.id} className="mt-1" />
                <Label htmlFor={address.id} className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span className="font-medium">{address.label}</span>
                    {address.is_default && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {address.full_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {address.address_line1}
                    {address.address_line2 && `, ${address.address_line2}`}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {address.city}, {address.postal_code}, {address.country}
                  </p>
                </Label>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => deleteAddress.mutate(address.id)}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </RadioGroup>
    </div>
  );
}

function AddressForm({
  address,
  onChange,
  onSubmit,
  isLoading,
}: {
  address: any;
  onChange: (address: any) => void;
  onSubmit: () => void;
  isLoading: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Label</Label>
          <Input
            value={address.label}
            onChange={(e) => onChange({ ...address, label: e.target.value })}
            placeholder="Home, Work, etc."
          />
        </div>
        <div>
          <Label>Full Name</Label>
          <Input
            value={address.full_name}
            onChange={(e) => onChange({ ...address, full_name: e.target.value })}
            placeholder="John Doe"
          />
        </div>
      </div>
      <div>
        <Label>Phone</Label>
        <Input
          value={address.phone}
          onChange={(e) => onChange({ ...address, phone: e.target.value })}
          placeholder="+91 98765 43210"
        />
      </div>
      <div>
        <Label>Address Line 1</Label>
        <Input
          value={address.address_line1}
          onChange={(e) => onChange({ ...address, address_line1: e.target.value })}
          placeholder="Street address"
        />
      </div>
      <div>
        <Label>Address Line 2 (Optional)</Label>
        <Input
          value={address.address_line2}
          onChange={(e) => onChange({ ...address, address_line2: e.target.value })}
          placeholder="Apartment, suite, etc."
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>City</Label>
          <Input
            value={address.city}
            onChange={(e) => onChange({ ...address, city: e.target.value })}
          />
        </div>
        <div>
          <Label>Postal Code</Label>
          <Input
            value={address.postal_code}
            onChange={(e) => onChange({ ...address, postal_code: e.target.value })}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>State</Label>
          <Input
            value={address.state}
            onChange={(e) => onChange({ ...address, state: e.target.value })}
          />
        </div>
        <div>
          <Label>Country</Label>
          <Input
            value={address.country}
            onChange={(e) => onChange({ ...address, country: e.target.value })}
          />
        </div>
      </div>
      <Button onClick={onSubmit} disabled={isLoading} className="w-full">
        {isLoading ? "Saving..." : "Save Address"}
      </Button>
    </div>
  );
}

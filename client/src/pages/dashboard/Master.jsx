import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// api services
import { fetchWarehouse, getWarehouseById } from "@/services/warehouseService";

// components
import statesAndCities from "@/constants/statecities.json";
import ItemForm from "@/components/master/ItemForm";
import TransportForm from "@/components/master/TransportForm";
import WarehouseForm from "@/components/master/WarehouseForm";
import BuyerForm from "@/components/master/BuyerForm";
import ManufacturerForm from "@/components/master/ManufacturerForm";
import { MasterSidenav } from "@/widgets/layout";

export function Master() {
  const [selectedComponent, setSelectedComponent] = useState("warehouse");

  const renderComponent = () => {
    switch (selectedComponent) {
      case "warehouse":
        return <WarehouseForm />;
      case "addItems":
        return <ItemForm />;
      case "addTransportation":
        return <TransportForm />;
      case "addBuyer":
        return <BuyerForm />;
      case "addManufacturer":
        return <ManufacturerForm />;
      default:
        return null;
    }
  };

  const states = Object.keys(statesAndCities);
  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [warehouseName, setWarehouseName] = useState("");
  const [selectedWarehouseID, setSelectedWarehouseID] = useState("");
  const [filteredWarehouses, setFilteredWarehouses] = useState([]);
  const [currentWarehouse, setCurrentWarehouse] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const storedWarehouseID = localStorage.getItem("warehouse");
    if (storedWarehouseID) {
      getWarehouseById(storedWarehouseID).then((warehouse) => {
        setCurrentWarehouse(warehouse);
        setSelectedWarehouseID(storedWarehouseID);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setSelectedCity("");
    setFilteredWarehouses([]);
  }, [selectedState]);

  useEffect(() => {
    const fetchFilteredWarehouses = async () => {
      if (selectedCity && selectedState) {
        setLoading(true);
        const warehousesData = await fetchWarehouse(
          selectedState,
          selectedCity
        );
        setFilteredWarehouses(warehousesData?.warehouses);
        setLoading(false);
      } else {
        setFilteredWarehouses([]);
        setLoading(false);
      }
    };

    fetchFilteredWarehouses();
  }, [selectedCity]);

  return (
    <div className="flex">
      <div className="fixed w-[20%] p-5">
        <MasterSidenav onSelect={setSelectedComponent} />
      </div>

      <div className="w-[80%] ml-[19%] px-5">
        <div className="p-10">{renderComponent()}</div>
      </div>
    </div>
  );
}

export default Master;

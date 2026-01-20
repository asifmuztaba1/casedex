"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useCourtDivisions,
  useCourtDistricts,
  useCourtTypes,
  useCourts,
  useCreateCourtDivision,
  useUpdateCourtDivision,
  useDeleteCourtDivision,
  useCreateCourtDistrict,
  useUpdateCourtDistrict,
  useDeleteCourtDistrict,
  useCreateCourtType,
  useUpdateCourtType,
  useDeleteCourtType,
  useCreateCourt,
  useUpdateCourt,
  useDeleteCourt,
} from "@/features/admin/courts/use-admin-courts";
import { useCountries } from "@/features/countries/use-countries";
import { useLocale } from "@/components/locale-provider";
import { formatCountryLabel } from "@/features/countries/country-label";

type SimpleForm = {
  name: string;
  name_bn: string;
};

export default function AdminCourtsPage() {
  const { t } = useLocale();
  const { data: countriesData } = useCountries();
  const countries = countriesData?.data ?? [];
  const [countryId, setCountryId] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (!countryId && countries.length > 0) {
      const activeCountry = countries.find((country) => country.active);
      const bd = countries.find((country) => country.code === "BD");
      setCountryId(activeCountry?.id ?? bd?.id ?? countries[0].id);
    }
  }, [countries, countryId]);

  const { data: divisions = [] } = useCourtDivisions(countryId);
  const { data: types = [] } = useCourtTypes(countryId);

  const [divisionFilter, setDivisionFilter] = useState("");
  const [districtFilter, setDistrictFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const { data: allDistricts = [] } = useCourtDistricts(countryId);
  const filteredDistricts = useMemo(() => {
    if (!divisionFilter) {
      return allDistricts;
    }
    return allDistricts.filter(
      (district) => district.division?.public_id === divisionFilter
    );
  }, [allDistricts, divisionFilter]);

  const { data: courts = [] } = useCourts(
    countryId,
    districtFilter || undefined,
    typeFilter || undefined
  );

  const createDivision = useCreateCourtDivision();
  const updateDivision = useUpdateCourtDivision();
  const deleteDivision = useDeleteCourtDivision();
  const createDistrict = useCreateCourtDistrict();
  const updateDistrict = useUpdateCourtDistrict();
  const deleteDistrict = useDeleteCourtDistrict();
  const createType = useCreateCourtType();
  const updateType = useUpdateCourtType();
  const deleteType = useDeleteCourtType();
  const createCourt = useCreateCourt();
  const updateCourt = useUpdateCourt();
  const deleteCourt = useDeleteCourt();

  const [divisionForm, setDivisionForm] = useState<SimpleForm>({
    name: "",
    name_bn: "",
  });
  const [editingDivision, setEditingDivision] = useState<string | null>(null);

  const [districtForm, setDistrictForm] = useState({
    division_public_id: "",
    name: "",
    name_bn: "",
  });
  const [editingDistrict, setEditingDistrict] = useState<string | null>(null);

  const [typeForm, setTypeForm] = useState<SimpleForm>({
    name: "",
    name_bn: "",
  });
  const [editingType, setEditingType] = useState<string | null>(null);

  const [courtForm, setCourtForm] = useState({
    district_public_id: "",
    court_type_public_id: "",
    name: "",
    name_bn: "",
    is_active: true,
  });
  const [editingCourt, setEditingCourt] = useState<string | null>(null);

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
            {t("admin.courts.kicker")}
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">
            {t("admin.courts.title")}
          </h1>
          <p className="text-sm text-slate-600">{t("admin.courts.subtitle")}</p>
        </div>
        <div className="min-w-[220px]">
          <label className="text-xs uppercase tracking-[0.3em] text-slate-500">
            {t("admin.country")}
          </label>
          <select
            className="mt-2 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900"
            value={countryId ?? ""}
            onChange={(event) => setCountryId(Number(event.target.value))}
          >
            {countries.map((country) => (
              <option key={country.id} value={country.id} disabled={!country.active}>
                {formatCountryLabel(country, t)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Tabs defaultValue="divisions">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="divisions">{t("admin.courts.tabs.divisions")}</TabsTrigger>
          <TabsTrigger value="districts">{t("admin.courts.tabs.districts")}</TabsTrigger>
          <TabsTrigger value="types">{t("admin.courts.tabs.types")}</TabsTrigger>
          <TabsTrigger value="courts">{t("admin.courts.tabs.courts")}</TabsTrigger>
        </TabsList>

        <TabsContent value="divisions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("admin.courts.divisions.title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                <Input
                  placeholder={t("admin.courts.form.name_en")}
                  value={divisionForm.name}
                  onChange={(event) =>
                    setDivisionForm((prev) => ({ ...prev, name: event.target.value }))
                  }
                />
                <Input
                  placeholder={t("admin.courts.form.name_bn")}
                  value={divisionForm.name_bn}
                  onChange={(event) =>
                    setDivisionForm((prev) => ({ ...prev, name_bn: event.target.value }))
                  }
                />
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => {
                      if (!countryId) {
                        return;
                      }
                      if (editingDivision) {
                        updateDivision.mutate({
                          public_id: editingDivision,
                          name: divisionForm.name,
                          name_bn: divisionForm.name_bn,
                        });
                      } else {
                        createDivision.mutate({
                          country_id: countryId,
                          name: divisionForm.name,
                          name_bn: divisionForm.name_bn,
                        });
                      }
                      setDivisionForm({ name: "", name_bn: "" });
                      setEditingDivision(null);
                    }}
                  >
                    {editingDivision ? t("common.update") : t("common.add")}
                  </Button>
                  {editingDivision && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditingDivision(null);
                        setDivisionForm({ name: "", name_bn: "" });
                      }}
                    >
                      {t("common.cancel")}
                    </Button>
                  )}
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("admin.courts.form.name_en")}</TableHead>
                    <TableHead>{t("admin.courts.form.name_bn")}</TableHead>
                    <TableHead>{t("table.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {divisions.map((division) => (
                    <TableRow key={division.public_id}>
                      <TableCell>{division.name}</TableCell>
                      <TableCell>{division.name_bn}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingDivision(division.public_id);
                              setDivisionForm({
                                name: division.name,
                                name_bn: division.name_bn,
                              });
                            }}
                          >
                            {t("admin.courts.action.edit")}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteDivision.mutate(division.public_id)}
                          >
                            {t("admin.courts.action.delete")}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="districts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("admin.courts.districts.title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                <select
                  className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900"
                  value={districtForm.division_public_id}
                  onChange={(event) =>
                    setDistrictForm((prev) => ({
                      ...prev,
                      division_public_id: event.target.value,
                    }))
                  }
                >
                  <option value="">{t("admin.courts.form.select_division")}</option>
                  {divisions.map((division) => (
                    <option key={division.public_id} value={division.public_id}>
                      {division.name}
                    </option>
                  ))}
                </select>
                <Input
                  placeholder={t("admin.courts.form.name_en")}
                  value={districtForm.name}
                  onChange={(event) =>
                    setDistrictForm((prev) => ({ ...prev, name: event.target.value }))
                  }
                />
                <Input
                  placeholder={t("admin.courts.form.name_bn")}
                  value={districtForm.name_bn}
                  onChange={(event) =>
                    setDistrictForm((prev) => ({ ...prev, name_bn: event.target.value }))
                  }
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => {
                    if (!districtForm.division_public_id) {
                      return;
                    }
                    if (editingDistrict) {
                      updateDistrict.mutate({
                        public_id: editingDistrict,
                        name: districtForm.name,
                        name_bn: districtForm.name_bn,
                        division_public_id: districtForm.division_public_id,
                      });
                    } else {
                      createDistrict.mutate({
                        division_public_id: districtForm.division_public_id,
                        name: districtForm.name,
                        name_bn: districtForm.name_bn,
                      });
                    }
                    setDistrictForm({ division_public_id: "", name: "", name_bn: "" });
                    setEditingDistrict(null);
                  }}
                >
                  {editingDistrict ? t("common.update") : t("common.add")}
                </Button>
                {editingDistrict && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingDistrict(null);
                      setDistrictForm({ division_public_id: "", name: "", name_bn: "" });
                    }}
                  >
                    {t("common.cancel")}
                  </Button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
                <span>{t("admin.courts.filter.division")}</span>
                <select
                  className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900"
                  value={divisionFilter}
                  onChange={(event) => setDivisionFilter(event.target.value)}
                >
                  <option value="">{t("admin.courts.filter.all")}</option>
                  {divisions.map((division) => (
                    <option key={division.public_id} value={division.public_id}>
                      {division.name}
                    </option>
                  ))}
                </select>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("admin.courts.form.name_en")}</TableHead>
                    <TableHead>{t("admin.courts.form.name_bn")}</TableHead>
                    <TableHead>{t("admin.courts.form.division")}</TableHead>
                    <TableHead>{t("table.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDistricts.map((district) => (
                    <TableRow key={district.public_id}>
                      <TableCell>{district.name}</TableCell>
                      <TableCell>{district.name_bn}</TableCell>
                      <TableCell>{district.division?.name ?? "-"}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingDistrict(district.public_id);
                              setDistrictForm({
                                division_public_id: district.division?.public_id ?? "",
                                name: district.name,
                                name_bn: district.name_bn,
                              });
                            }}
                          >
                            {t("admin.courts.action.edit")}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteDistrict.mutate(district.public_id)}
                          >
                            {t("admin.courts.action.delete")}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="types" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("admin.courts.types.title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                <Input
                  placeholder={t("admin.courts.form.name_en")}
                  value={typeForm.name}
                  onChange={(event) =>
                    setTypeForm((prev) => ({ ...prev, name: event.target.value }))
                  }
                />
                <Input
                  placeholder={t("admin.courts.form.name_bn")}
                  value={typeForm.name_bn}
                  onChange={(event) =>
                    setTypeForm((prev) => ({ ...prev, name_bn: event.target.value }))
                  }
                />
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => {
                      if (!countryId) {
                        return;
                      }
                      if (editingType) {
                        updateType.mutate({
                          public_id: editingType,
                          name: typeForm.name,
                          name_bn: typeForm.name_bn,
                        });
                      } else {
                        createType.mutate({
                          country_id: countryId,
                          name: typeForm.name,
                          name_bn: typeForm.name_bn,
                        });
                      }
                      setTypeForm({ name: "", name_bn: "" });
                      setEditingType(null);
                    }}
                  >
                    {editingType ? t("common.update") : t("common.add")}
                  </Button>
                  {editingType && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditingType(null);
                        setTypeForm({ name: "", name_bn: "" });
                      }}
                    >
                      {t("common.cancel")}
                    </Button>
                  )}
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("admin.courts.form.name_en")}</TableHead>
                    <TableHead>{t("admin.courts.form.name_bn")}</TableHead>
                    <TableHead>{t("table.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {types.map((courtType) => (
                    <TableRow key={courtType.public_id}>
                      <TableCell>{courtType.name}</TableCell>
                      <TableCell>{courtType.name_bn}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingType(courtType.public_id);
                              setTypeForm({
                                name: courtType.name,
                                name_bn: courtType.name_bn,
                              });
                            }}
                          >
                            {t("admin.courts.action.edit")}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteType.mutate(courtType.public_id)}
                          >
                            {t("admin.courts.action.delete")}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="courts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("admin.courts.courts.title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <select
                  className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900"
                  value={courtForm.district_public_id}
                  onChange={(event) =>
                    setCourtForm((prev) => ({
                      ...prev,
                      district_public_id: event.target.value,
                    }))
                  }
                >
                  <option value="">{t("admin.courts.form.select_district")}</option>
                  {allDistricts.map((district) => (
                    <option key={district.public_id} value={district.public_id}>
                      {district.name}
                    </option>
                  ))}
                </select>
                <select
                  className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900"
                  value={courtForm.court_type_public_id}
                  onChange={(event) =>
                    setCourtForm((prev) => ({
                      ...prev,
                      court_type_public_id: event.target.value,
                    }))
                  }
                >
                  <option value="">{t("admin.courts.form.select_type")}</option>
                  {types.map((courtType) => (
                    <option key={courtType.public_id} value={courtType.public_id}>
                      {courtType.name}
                    </option>
                  ))}
                </select>
                <Input
                  placeholder={t("admin.courts.form.name_en")}
                  value={courtForm.name}
                  onChange={(event) =>
                    setCourtForm((prev) => ({ ...prev, name: event.target.value }))
                  }
                />
                <Input
                  placeholder={t("admin.courts.form.name_bn")}
                  value={courtForm.name_bn}
                  onChange={(event) =>
                    setCourtForm((prev) => ({ ...prev, name_bn: event.target.value }))
                  }
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900"
                  value={courtForm.is_active ? "1" : "0"}
                  onChange={(event) =>
                    setCourtForm((prev) => ({
                      ...prev,
                      is_active: event.target.value === "1",
                    }))
                  }
                >
                  <option value="1">{t("admin.courts.form.active")}</option>
                  <option value="0">{t("admin.courts.form.inactive")}</option>
                </select>
                <Button
                  onClick={() => {
                    if (!courtForm.district_public_id || !courtForm.court_type_public_id) {
                      return;
                    }
                    if (editingCourt) {
                      updateCourt.mutate({
                        public_id: editingCourt,
                        name: courtForm.name,
                        name_bn: courtForm.name_bn,
                        district_public_id: courtForm.district_public_id,
                        court_type_public_id: courtForm.court_type_public_id,
                        is_active: courtForm.is_active,
                      });
                    } else {
                      createCourt.mutate({
                        district_public_id: courtForm.district_public_id,
                        court_type_public_id: courtForm.court_type_public_id,
                        name: courtForm.name,
                        name_bn: courtForm.name_bn,
                        is_active: courtForm.is_active,
                      });
                    }
                    setCourtForm({
                      district_public_id: "",
                      court_type_public_id: "",
                      name: "",
                      name_bn: "",
                      is_active: true,
                    });
                    setEditingCourt(null);
                  }}
                >
                  {editingCourt ? t("common.update") : t("common.add")}
                </Button>
                {editingCourt && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingCourt(null);
                      setCourtForm({
                        district_public_id: "",
                        court_type_public_id: "",
                        name: "",
                        name_bn: "",
                        is_active: true,
                      });
                    }}
                  >
                    {t("common.cancel")}
                  </Button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
                <span>{t("admin.courts.filter.district")}</span>
                <select
                  className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900"
                  value={districtFilter}
                  onChange={(event) => setDistrictFilter(event.target.value)}
                >
                  <option value="">{t("admin.courts.filter.all")}</option>
                  {allDistricts.map((district) => (
                    <option key={district.public_id} value={district.public_id}>
                      {district.name}
                    </option>
                  ))}
                </select>
                <span>{t("admin.courts.filter.type")}</span>
                <select
                  className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900"
                  value={typeFilter}
                  onChange={(event) => setTypeFilter(event.target.value)}
                >
                  <option value="">{t("admin.courts.filter.all")}</option>
                  {types.map((courtType) => (
                    <option key={courtType.public_id} value={courtType.public_id}>
                      {courtType.name}
                    </option>
                  ))}
                </select>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("admin.courts.form.name_en")}</TableHead>
                    <TableHead>{t("admin.courts.form.name_bn")}</TableHead>
                    <TableHead>{t("admin.courts.form.district")}</TableHead>
                    <TableHead>{t("admin.courts.form.type")}</TableHead>
                    <TableHead>{t("admin.courts.form.status")}</TableHead>
                    <TableHead>{t("table.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courts.map((court) => (
                    <TableRow key={court.public_id}>
                      <TableCell>{court.name}</TableCell>
                      <TableCell>{court.name_bn}</TableCell>
                      <TableCell>{court.district?.name ?? "-"}</TableCell>
                      <TableCell>{court.court_type?.name ?? "-"}</TableCell>
                      <TableCell>
                        {court.is_active
                          ? t("admin.courts.form.active")
                          : t("admin.courts.form.inactive")}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingCourt(court.public_id);
                              setCourtForm({
                                district_public_id: court.district?.public_id ?? "",
                                court_type_public_id: court.court_type?.public_id ?? "",
                                name: court.name,
                                name_bn: court.name_bn,
                                is_active: court.is_active,
                              });
                            }}
                          >
                            {t("admin.courts.action.edit")}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteCourt.mutate(court.public_id)}
                          >
                            {t("admin.courts.action.delete")}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </section>
  );
}

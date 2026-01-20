import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { TemplateForm } from "./AdminTemplates";

export default function TemplateFormPage() {
  const { id } = useParams();
  const [tpl, setTpl] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      fetch(process.env.REACT_APP_API_URL + "/api/templates/" + id)
        .then((res) => res.json())
        .then(setTpl)
        .catch(() => {
          alert("Failed to load template");
          navigate("/admin/templates");
        });
    }
  }, [id, navigate]);

  if (id && !tpl) return <div style={{ padding: 32 }}>Loading...</div>;
  return <TemplateForm initialData={tpl} />;
}

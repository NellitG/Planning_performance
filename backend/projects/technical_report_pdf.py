from io import BytesIO
from pathlib import Path
from urllib.parse import urlparse

from django.conf import settings
from django.utils import timezone
from PIL import Image as PILImage
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    Image,
    KeepTogether,
    LongTable,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    TableStyle,
)
from xml.sax.saxutils import escape


GREEN = colors.HexColor("#006838")
LIGHT_GREEN = colors.HexColor("#EAF3ED")
GRAY = colors.HexColor("#59636E")
RULE = colors.HexColor("#D8E0DA")


def _value(value):
    if value is None or value == "":
        return "Not provided"
    return escape(str(value)).replace("\n", "<br/>")


def _number(value):
    try:
        return f"{float(value or 0):,.2f}"
    except (TypeError, ValueError):
        return _value(value)


def _date(value):
    if not value:
        return "Not provided"
    if hasattr(value, "tzinfo") and value.tzinfo:
        value = timezone.localtime(value)
    return value.strftime("%d %b %Y")


def _safe_document_name(value):
    if isinstance(value, dict):
        value = value.get("name") or value.get("file") or value.get("title") or ""
    parsed_path = urlparse(str(value or "")).path
    name = Path(parsed_path).name
    return name or "Supporting document"


def _paragraph(text, style):
    return Paragraph(_value(text), style)


def _location_for_row(row, report):
    location = row.project_location
    ward = row.ward or (location.ward if location else report.ward)
    county = location.county if location else (ward.sub_county.county if ward else None)
    sub_county = location.sub_county if location else (ward.sub_county if ward else None)
    return " / ".join(
        item.name for item in (county, sub_county, ward) if item is not None
    ) or "General"


def _project_mapping(project):
    if not project:
        return []
    from .models import ProjectMapping, Strategy, StrategicObjective

    try:
        mapping = project.mapping
    except ProjectMapping.DoesNotExist:
        return []

    rows = []
    for objective in StrategicObjective.objects.filter(
        pk__in=mapping.objective_ids
    ).select_related("key_result_area"):
        rows.append((objective.key_result_area.title, objective.text, ""))
    for strategy in Strategy.objects.filter(
        pk__in=mapping.strategy_ids
    ).select_related("strategic_objective__key_result_area"):
        objective = strategy.strategic_objective
        rows.append((objective.key_result_area.title, objective.text, strategy.text))
    return rows


def _image_flowable(data, max_width, max_height):
    with PILImage.open(BytesIO(data)) as source:
        source.load()
        source.thumbnail((1800, 1400))
        image_buffer = BytesIO()
        source.convert("RGB").save(image_buffer, format="JPEG", quality=88)
        width, height = source.size
    scale = min(max_width / width, max_height / height, 1)
    image_buffer.seek(0)
    return Image(image_buffer, width=width * scale, height=height * scale)


def build_technical_report_pdf(report):
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(
        name="ReportTitle", parent=styles["Title"], textColor=GREEN,
        fontName="Helvetica-Bold", fontSize=20, leading=24, alignment=TA_CENTER,
        spaceAfter=5 * mm,
    ))
    styles.add(ParagraphStyle(
        name="SectionHeading", parent=styles["Heading2"], textColor=GREEN,
        fontName="Helvetica-Bold", fontSize=12, leading=15, spaceBefore=5 * mm,
        spaceAfter=2 * mm, keepWithNext=True,
    ))
    styles.add(ParagraphStyle(
        name="BodySmall", parent=styles["BodyText"], fontName="Helvetica",
        fontSize=8.5, leading=12, textColor=colors.HexColor("#202820"),
    ))
    styles.add(ParagraphStyle(
        name="TableHeader", parent=styles["BodyText"], fontName="Helvetica-Bold",
        fontSize=8, leading=10, textColor=colors.white,
    ))
    styles.add(ParagraphStyle(
        name="TableCell", parent=styles["BodyText"], fontName="Helvetica",
        fontSize=7.5, leading=10,
    ))
    styles.add(ParagraphStyle(
        name="TableLabel", parent=styles["BodyText"], fontName="Helvetica-Bold",
        fontSize=7.5, leading=10, textColor=GRAY,
    ))

    def section(title):
        return Paragraph(escape(title), styles["SectionHeading"])

    def data_table(rows, widths=None, header=True):
        converted = [
            [
                _paragraph(value, styles["TableHeader"] if header and row_index == 0 else styles["TableCell"])
                for value in row
            ]
            for row_index, row in enumerate(rows)
        ]
        table = LongTable(converted, colWidths=widths, repeatRows=1 if header else 0, hAlign="LEFT")
        table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), GREEN if header else LIGHT_GREEN),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white if header else colors.black),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("GRID", (0, 0), (-1, -1), 0.35, RULE),
            ("LEFTPADDING", (0, 0), (-1, -1), 5),
            ("RIGHTPADDING", (0, 0), (-1, -1), 5),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("ROWBACKGROUNDS", (0, 1 if header else 0), (-1, -1), [colors.white, colors.HexColor("#F6F8F6")]),
        ]))
        return table

    project = report.project
    story = [
        Spacer(1, 2 * mm),
        Paragraph("TECHNICAL REPORT", styles["ReportTitle"]),
        _paragraph(report.title, styles["Heading1"]),
        Spacer(1, 2 * mm),
        data_table([
            ["Report ID", "Status", "Created"],
            [f"TR-{report.pk}", report.status, _date(report.created_at)],
        ], [55 * mm, 65 * mm, 45 * mm]),
        section("Project Identification and Reporting Period"),
        data_table([
            ["Main Project", "Project Title"],
            [report.main_project.name if report.main_project_id else "Not provided", project.project_name if project else "Not provided"],
            ["Financial Year", "Quarter / Reporting Period"],
            [report.financial_year or "Not provided", " / ".join(filter(None, [report.quarter, report.reporting_period])) or "Not provided"],
            ["Main Activity", "Sub Activity"],
            [report.main_activity.name if report.main_activity_id else "Not provided", report.sub_activity.name if report.sub_activity_id else "Not provided"],
            ["Category", "Value Chain"],
            [report.category or "Not provided", report.value_chain or "Not provided"],
        ], [82.5 * mm, 82.5 * mm], header=False),
    ]

    if project:
        story.append(section("Project Background and Objectives"))
        for label, value in (
            ("Description", project.description),
            ("Background", project.background),
            ("Objectives", project.project_objectives),
            ("Expected outcomes", project.expected_outcomes),
        ):
            if value:
                story.extend([Paragraph(escape(label), styles["Heading4"]), _paragraph(value, styles["BodySmall"]), Spacer(1, 2 * mm)])

        alignment = _project_mapping(project)
        if alignment:
            story.extend([
                section("Strategic Alignment"),
                data_table([["Key Result Area", "Objective", "Strategy"], *alignment], [44 * mm, 70 * mm, 51 * mm]),
            ])

        beneficiaries = [
            ["Beneficiary Group", "Recorded Count"],
            ["Total", project.total_beneficiaries if project.total_beneficiaries is not None else "Not provided"],
            ["Women", project.women if project.women is not None else "Not provided"],
            ["Men", project.men if project.men is not None else "Not provided"],
            ["Youth", project.youth if project.youth is not None else "Not provided"],
            ["Persons with disabilities", project.pwds if project.pwds is not None else "Not provided"],
        ]
        story.extend([section("Beneficiaries"), data_table(beneficiaries, [120 * mm, 45 * mm])])

    locations = list(report.selected_locations or [])
    if not locations and report.ward_id:
        ward = report.ward
        locations = [{
            "countyName": ward.sub_county.county.name,
            "subCountyName": ward.sub_county.name,
            "wardName": ward.name,
            "level": "Ward",
        }]
    story.extend([section("Project Locations"), data_table(
        [["Level", "County", "Sub-county", "Ward"]]
        + [[item.get("level", ""), item.get("countyName", ""), item.get("subCountyName", ""), item.get("wardName", "")] for item in locations]
        if locations else [["Level", "County", "Sub-county", "Ward"], ["Not provided", "Not provided", "Not provided", "Not provided"]],
        [24 * mm, 50 * mm, 50 * mm, 50 * mm],
    )])

    story.extend([
        section("Financial Information"),
        data_table([
            ["Financial Measure", "Amount (KES)"],
            ["Approved project budget", _number(project.expected_budget) if project and project.expected_budget is not None else "Not provided"],
            ["Amount disbursed", _number(report.disbursed_amount)],
            ["Amount utilized", _number(report.utilized_amount)],
            ["Amount remaining", _number(max(0, float(report.disbursed_amount or 0) - float(report.utilized_amount or 0)))],
            ["Percentage utilization", f"{_number(report.percentage_utilization)}%"],
        ], [100 * mm, 75 * mm]),
    ])

    indicator_rows = [["Location", "Indicator", "Target", "Achievement", "Progress", "Remarks / Explanation"]]
    for item in report.indicator_reports.select_related(
        "ward__sub_county__county", "project_location__county",
        "project_location__sub_county", "project_location__ward",
    ).prefetch_related("evidence_files"):
        indicator_rows.append([
            _location_for_row(item, report),
            item.indicator_name,
            _number(item.target),
            _number(item.reported_value),
            f"{min(100, float(item.reported_value / item.target * 100)):.1f}%"
            if item.target and item.reported_value is not None
            else "N/A",
            "\n".join(filter(None, [item.achievement, item.remarks, f"Reason for zero: {item.reason_for_zero}" if item.reason_for_zero else "" ])) or "Not provided",
        ])
    story.extend([section("Indicators, Targets and Achievements"), data_table(
        indicator_rows,
        [28 * mm, 37 * mm, 18 * mm, 22 * mm, 19 * mm, 50 * mm],
    )])

    if report.sub_sub_activities:
        activity_rows = [["Activity", "Approved Activity Budget (KES)"]]
        activity_rows.extend([
            [item.get("name", "Not provided"), _number(item.get("approvedActivityBudget"))]
            for item in report.sub_sub_activities if isinstance(item, dict)
        ])
        if len(activity_rows) > 1:
            story.extend([section("Approved Activity Budgets"), data_table(activity_rows, [115 * mm, 60 * mm])])

    for title, value in (
        ("Overall Achievement", report.achievement),
        ("Report Remarks", report.remarks),
        ("Supporting Information", report.supporting_information),
    ):
        if value:
            story.extend([section(title), _paragraph(value, styles["BodySmall"]), Spacer(1, 2 * mm)])

    supporting_documents = [
        _safe_document_name(value) for value in (report.supporting_documents or [])
    ]
    if project:
        for document in project.documents.prefetch_related("files"):
            supporting_documents.extend(file.name or document.name for file in document.files.all())
    if supporting_documents:
        story.extend([
            section("Supporting Documents"),
            data_table([["Document"]] + [[name] for name in dict.fromkeys(supporting_documents)], [174 * mm]),
        ])

    source_report = report.original_report or report
    workflow = list(source_report.workflow_audit.select_related("user").order_by("created_at"))
    if workflow:
        story.extend([section("Approval and Review History"), data_table(
            [["Action / Status", "Reviewer", "Role", "Date", "Comments / Reason"]]
            + [[
                f"{event.action}: {event.new_status or event.previous_status}",
                event.user.full_name if event.user else "Deleted user",
                event.user_role,
                timezone.localtime(event.created_at).strftime("%d %b %Y %H:%M") if event.created_at else "Not provided",
                "\n".join(filter(None, [event.comments, event.rejection_reason])) or "Not provided",
            ] for event in workflow],
            [34 * mm, 31 * mm, 23 * mm, 30 * mm, 66 * mm],
        )])

    evidence = []
    for item in report.indicator_reports.prefetch_related("evidence_files").all():
        for attachment in item.evidence_files.all():
            evidence.append((item.indicator_name, attachment))
    story.append(section("Evidence Appendix"))
    if not evidence:
        story.append(_paragraph("No report evidence was uploaded.", styles["BodySmall"]))
    for index, (indicator_name, attachment) in enumerate(evidence, start=1):
        story.append(KeepTogether([
            Paragraph(f"Evidence {index}: {_value(attachment.name)}", styles["Heading3"]),
            _paragraph(f"Indicator: {indicator_name}", styles["BodySmall"]),
            _paragraph(f"Uploaded: {_date(attachment.created_at)}", styles["BodySmall"]),
        ]))
        try:
            if attachment.file.size > 15 * 1024 * 1024:
                raise ValueError("Evidence exceeds the PDF embedding size limit.")
            with attachment.file.open("rb") as evidence_file:
                image_data = evidence_file.read()
            if Path(attachment.name).suffix.lower() in {".jpg", ".jpeg", ".png", ".gif", ".webp"}:
                story.append(_image_flowable(image_data, 170 * mm, 115 * mm))
            else:
                story.append(_paragraph("Attachment is available for preview or download in the Technical Reports interface.", styles["BodySmall"]))
        except Exception:
            story.append(_paragraph("File could not be embedded; use the protected report evidence link to preview or download it.", styles["BodySmall"]))
        story.append(Spacer(1, 4 * mm))

    output = BytesIO()
    logo_path = settings.BASE_DIR.parent / "frontend" / "src" / "assets" / "logo.png"

    def draw_page(canvas, document):
        canvas.saveState()
        if logo_path.is_file():
            canvas.drawImage(str(logo_path), 18 * mm, A4[1] - 25 * mm, width=24 * mm, height=16 * mm, preserveAspectRatio=True, mask="auto", anchor="c")
        canvas.setFillColor(GREEN)
        canvas.setFont("Helvetica-Bold", 9)
        canvas.drawString(46 * mm, A4[1] - 16 * mm, "KALRO | Technical Reports")
        canvas.setStrokeColor(RULE)
        canvas.line(18 * mm, A4[1] - 29 * mm, A4[0] - 18 * mm, A4[1] - 29 * mm)
        canvas.line(18 * mm, 14 * mm, A4[0] - 18 * mm, 14 * mm)
        canvas.setFillColor(GRAY)
        canvas.setFont("Helvetica", 8)
        canvas.drawRightString(A4[0] - 18 * mm, 9 * mm, f"Page {document.page}")
        canvas.restoreState()

    document = SimpleDocTemplate(
        output,
        pagesize=A4,
        rightMargin=18 * mm,
        leftMargin=18 * mm,
        topMargin=36 * mm,
        bottomMargin=20 * mm,
        title=f"Technical Report - {report.title}",
        author="KALRO PPM&QC",
    )
    document.build(story, onFirstPage=draw_page, onLaterPages=draw_page)
    return output.getvalue()
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("projects", "0007_subsubactivity"),
    ]

    operations = [
        migrations.AddField(
            model_name="outputindicator",
            name="budget_year_1",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=12),
        ),
        migrations.AddField(
            model_name="outputindicator",
            name="budget_year_2",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=12),
        ),
        migrations.AddField(
            model_name="outputindicator",
            name="budget_year_3",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=12),
        ),
        migrations.AddField(
            model_name="outputindicator",
            name="budget_year_4",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=12),
        ),
        migrations.AddField(
            model_name="outputindicator",
            name="budget_year_5",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=12),
        ),
        migrations.AddField(
            model_name="outputindicator",
            name="cumulative_target",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=12),
        ),
        migrations.AddField(
            model_name="outputindicator",
            name="total_budget_millions",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=12),
        ),
        migrations.AddField(
            model_name="outputindicator",
            name="year_1_target",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=12),
        ),
        migrations.AddField(
            model_name="outputindicator",
            name="year_2_target",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=12),
        ),
        migrations.AddField(
            model_name="outputindicator",
            name="year_3_target",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=12),
        ),
        migrations.AddField(
            model_name="outputindicator",
            name="year_4_target",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=12),
        ),
        migrations.AddField(
            model_name="outputindicator",
            name="year_5_target",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=12),
        ),
        migrations.CreateModel(
            name="Outcome",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("text", models.TextField()),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("key_result_area", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="outcomes", to="projects.keyresultarea")),
            ],
            options={"ordering": ["created_at"]},
        ),
        migrations.CreateModel(
            name="OutcomeIndicator",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("text", models.TextField()),
                ("baseline_value", models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ("midterm_target", models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ("endterm_target", models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("outcome", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="indicators", to="projects.outcome")),
            ],
            options={"ordering": ["created_at"]},
        ),
    ]

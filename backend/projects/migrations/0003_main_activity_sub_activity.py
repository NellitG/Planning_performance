from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("projects", "0002_remove_baseline"),
    ]

    operations = [
        migrations.CreateModel(
            name="MainActivity",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=500)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "verbose_name": "Main Activity",
                "verbose_name_plural": "Main Activities",
                "ordering": ["-created_at"],
            },
        ),
        migrations.CreateModel(
            name="SubActivity",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=500)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "verbose_name": "Sub Activity",
                "verbose_name_plural": "Sub Activities",
                "ordering": ["-created_at"],
            },
        ),
    ]

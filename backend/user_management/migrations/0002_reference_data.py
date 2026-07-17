from django.db import migrations, models
import django.db.models.deletion


DATA = [
    ("AMRI Katumani", "Machakos", [], [("Ithookwe", "Kitui"), ("Kampi Mawe", "Makueni"), ("Masongaleni", "Makueni"), ("Kiboko", "Makueni"), ("Voo", "Kitui")]),
    ("ABIRI Perkerra", "Baringo", [], [("Mochongoi", "Baringo")]),
    ("ARLRI Kiboko", "Makueni", [], []),
    ("BRI Lanet", "Nakuru", [("Mariakani", "Mombasa", [("Bamba", "Kilifi")]), ("Garissa", "Garissa", []), ("Trans Mara", "Narok", [("Ole Sentu", "Narok")])], []),
    ("BioRI Muguga", "Kiambu", [("Kabete", "Nairobi", [])], []),
    ("CRI Ruiru", "Kiambu", [("Kitale", "Trans Nzoia", [])], [("Azania", "Kiambu"), ("Namwela", "Bungoma"), ("Koru", "Kericho"), ("Mariene", "Meru"), ("Kisii", "Kisii")]),
    ("DRI Naivasha", "Nakuru", [("Ol Jororok", "Nyandarua", []), ("Msabaha", "Kilifi", [])], []),
    ("FCRI Kitale", "Trans Nzoia", [("Embu", "Embu", [("Igoji", "Meru")]), ("Njoro", "Nakuru", [("Tipis", "Nakuru")]), ("Kisii", "Kisii", [("Oyani", "Migori")]), ("Alupe", "Busia", []), ("Muguga", "Kiambu", []), ("Kabete", "Nairobi", [])], [("Marimanti", "Tharaka Nithi"), ("Homabay", "Homabay"), ("Lodwar", "Turkana")]),
    ("GeRRI Muguga", "Kiambu", [], []),
    ("HRI Kandara", "Murang'a", [("Tigoni", "Kiambu", [("Njabini", "Nyandarua")]), ("Kibos", "Kisumu", []), ("Matuga", "Kwale", [])], []),
    ("ICRI Mtwapa", "Kilifi", [("Molo", "Nakuru", [("Marindas", "Nakuru")]), ("Mwea", "Kirinyaga", []), ("Sericulture", "Muranga", [])], [("Mpeketoni", "Lamu"), ("Ngao", "Tana River"), ("Bibirioni", "Kiambu")]),
    ("MRI Laare", "Meru", [], []),
    ("NRI Kakamega", "Kakamega", [("Naivasha", "Nakuru", [])], []),
    ("SGCRI Marsabit", "Marsabit", [("Buchuma", "Taita Taveta", [("Gatab", "Marsabit")])], [("Kargi", "Marsabit"), ("Ngurunit", "Marsabit"), ("Gudas", "Marsabit")]),
    ("TRI Kericho", "Kericho", [], [("Kangaita", "Kirinyaga")]),
    ("VSRI Muguga", "Kiambu", [("Alupe", "Busia", [("Nguruman", "Kajiado")])], []),
    ("KALRO Seeds Thika", "Kiambu", [], []),
    ("KALRO Headquarters Loresho", "Nairobi", [], []),
]


def seed_reference_data(apps, schema_editor):
    County = apps.get_model("user_management", "County")
    Institute = apps.get_model("user_management", "Institute")
    Centre = apps.get_model("user_management", "Centre")
    SubCentre = apps.get_model("user_management", "SubCentre")

    def county(name):
        return County.objects.get_or_create(name=name)[0]

    for institute_name, institute_county, centres, direct_sub_centres in DATA:
        institute, _ = Institute.objects.get_or_create(name=institute_name, defaults={"county": county(institute_county)})
        for centre_name, centre_county, sub_centres in centres:
            centre, _ = Centre.objects.get_or_create(name=centre_name, institute=institute, defaults={"county": county(centre_county)})
            for sub_name, sub_county in sub_centres:
                SubCentre.objects.get_or_create(name=sub_name, institute=institute, defaults={"county": county(sub_county), "centre": centre})
        for sub_name, sub_county in direct_sub_centres:
            SubCentre.objects.get_or_create(name=sub_name, institute=institute, defaults={"county": county(sub_county), "centre": None})


class Migration(migrations.Migration):
    dependencies = [("user_management", "0001_initial")]

    operations = [
        migrations.CreateModel(name="County", fields=[("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")), ("name", models.CharField(max_length=100, unique=True))], options={"ordering": ["name"]}),
        migrations.CreateModel(name="Institute", fields=[("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")), ("name", models.CharField(max_length=255, unique=True)), ("county", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="institutes", to="user_management.county"))], options={"ordering": ["name"]}),
        migrations.CreateModel(name="Centre", fields=[("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")), ("name", models.CharField(max_length=255)), ("county", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="centres", to="user_management.county")), ("institute", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="centres", to="user_management.institute"))], options={"ordering": ["name"]}),
        migrations.CreateModel(name="SubCentre", fields=[("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")), ("name", models.CharField(max_length=255)), ("centre", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name="sub_centres", to="user_management.centre")), ("county", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="sub_centres", to="user_management.county")), ("institute", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="sub_centres", to="user_management.institute"))], options={"ordering": ["name"]}),
        migrations.AddConstraint(model_name="centre", constraint=models.UniqueConstraint(fields=("name", "institute"), name="unique_centre_per_institute")),
        migrations.AddConstraint(model_name="subcentre", constraint=models.UniqueConstraint(fields=("name", "institute"), name="unique_sub_centre_per_institute")),
        migrations.RunPython(seed_reference_data, migrations.RunPython.noop),
    ]
